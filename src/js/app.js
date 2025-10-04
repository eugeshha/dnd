class TrelloBoard {
  constructor() {
        this.cards = this.loadFromStorage();
    this.draggedCard = null;
    this.draggedFromColumn = null;
    this.draggedFromIndex = null;
        this.dropIndicator = null;

    this.init();
  }

  init() {
        this.createDropIndicator();
    this.bindEvents();
        this.renderCards();
    }

    createDropIndicator() {
    }

  bindEvents() {
        document.querySelectorAll('.add-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showAddCardForm(e.target));
        });

        document.querySelectorAll('.add-card-form').forEach(form => {
            const submitBtn = form.querySelector('.add-card-submit');
            const cancelBtn = form.querySelector('.add-card-cancel');
            const input = form.querySelector('.card-input');

            submitBtn.addEventListener('click', () => this.addCard(form));
            cancelBtn.addEventListener('click', () => this.hideAddCardForm(form));
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.addCard(form);
                } else if (e.key === 'Escape') {
                    this.hideAddCardForm(form);
                }
            });
        });

        this.bindDragAndDrop();
    }

    bindDragAndDrop() {
        document.addEventListener('mousedown', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;

            if (e.target.classList.contains('card-delete')) {
                return;
            }

            e.preventDefault();
            this.startDrag(card, e);
        });

        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
    }

    startDrag(card, e) {
        this.draggedCard = card;
        this.draggedFromColumn = card.closest('.column').dataset.column;
        this.draggedFromIndex = Array.from(card.parentNode.children).indexOf(card);
        
        const rect = card.getBoundingClientRect();
        this.originalWidth = rect.width;
        this.originalHeight = rect.height;
        
        card.classList.add('dragging');
        card.style.position = 'fixed';
        card.style.pointerEvents = 'none';
        card.style.zIndex = '1000';
        card.style.width = '250px';
        card.style.maxWidth = '250px';
        
        this.updateCardPosition(e);
    }

    drag(e) {
        if (!this.draggedCard) return;

        this.updateCardPosition(e);
        this.updateDropIndicator(e);
    }

    updateCardPosition(e) {
        const rect = this.draggedCard.getBoundingClientRect();
        this.draggedCard.style.left = `${e.clientX - rect.width / 2}px`;
        this.draggedCard.style.top = `${e.clientY - rect.height / 2}px`;
    }

    updateDropIndicator(e) {
        const dropTarget = this.getDropTarget(e);
        if (!dropTarget) {
            this.hideDropIndicator();
            return;
        }

        const { column, index } = dropTarget;
        this.showDropIndicator(column, index);
    }

    getDropTarget(e) {
        const columns = document.querySelectorAll('.column');
        
        for (const column of columns) {
            const rect = column.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && 
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                
                const cardsContainer = column.querySelector('.cards-container');
                if (!cardsContainer) continue;
                
                const cards = Array.from(cardsContainer.children).filter(card => 
                    !card.classList.contains('drop-placeholder') && 
                    !card.classList.contains('dragging')
                );
                
                if (cards.length === 0) {
                    return { column: column.dataset.column, index: 0 };
                }

                for (let i = 0; i < cards.length; i++) {
                    const cardRect = cards[i].getBoundingClientRect();
                    if (e.clientY < cardRect.top + cardRect.height / 2) {
                        return { column: column.dataset.column, index: i };
                    }
                }
                
                return { column: column.dataset.column, index: cards.length };
            }
        }
        
        return null;
    }

    showDropIndicator(columnId, index) {
        const column = document.querySelector(`[data-column="${columnId}"]`);
        if (!column) return;
        
        const cardsContainer = column.querySelector('.cards-container');
        if (!cardsContainer) return;
        
        const cards = Array.from(cardsContainer.children).filter(card => !card.classList.contains('drop-placeholder'));
        
        this.hideAllDropIndicators();
        
        if (cards.length === 0 || index >= cards.length) {
            const placeholder = this.createPlaceholder();
            cardsContainer.append(placeholder);
        } else {
            const targetCard = cards[index];
            if (targetCard && targetCard.parentNode) {
                const placeholder = this.createPlaceholder();
                targetCard.parentNode.insertBefore(placeholder, targetCard);
            }
        }
    }

    createPlaceholder() {
        const placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        placeholder.style.height = '40px';
        placeholder.style.background = '#4B0082';
        placeholder.style.borderRadius = '4px';
        placeholder.style.marginBottom = '8px';
        placeholder.style.opacity = '0.3';
        return placeholder;
    }

    hideAllDropIndicators() {
        document.querySelectorAll('.drop-placeholder').forEach(placeholder => {
            placeholder.remove();
        });
    }

    hideDropIndicator() {
        this.hideAllDropIndicators();
    }

    endDrag() {
        if (!this.draggedCard) return;

        const dropTarget = this.getDropTarget({ clientX: this.draggedCard.offsetLeft + this.draggedCard.offsetWidth / 2, 
                                               clientY: this.draggedCard.offsetTop + this.draggedCard.offsetHeight / 2 });
        
        if (dropTarget) {
            this.moveCard(dropTarget.column, dropTarget.index);
        }

        this.resetDragState();
    }

    resetDragState() {
        if (this.draggedCard) {
            this.draggedCard.classList.remove('dragging');
            this.draggedCard.style.position = '';
            this.draggedCard.style.left = '';
            this.draggedCard.style.top = '';
            this.draggedCard.style.pointerEvents = '';
            this.draggedCard.style.zIndex = '';
            this.draggedCard.style.width = '';
            this.draggedCard.style.maxWidth = '';
            this.draggedCard.style.transform = '';
        }
        
        this.hideDropIndicator();
      this.draggedCard = null;
      this.draggedFromColumn = null;
      this.draggedFromIndex = null;
        this.originalWidth = null;
        this.originalHeight = null;
    }

    moveCard(targetColumn, targetIndex) {
        const cardId = this.draggedCard.dataset.cardId;
        const cardIndex = this.cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return;

        const card = this.cards[cardIndex];
        
        if (card.column === targetColumn) {
            const targetCards = this.cards.filter(c => c.column === targetColumn);
            const currentPosition = targetCards.findIndex(c => c.id === cardId);
            if (currentPosition === targetIndex) {
                return;
            }
        }
        
        const updatedCard = {
            id: card.id,
            text: card.text,
            column: targetColumn
        };

        this.cards.splice(cardIndex, 1);

        const targetCards = this.cards.filter(c => c.column === targetColumn);
        const insertIndex = Math.min(targetIndex, targetCards.length);
        
        let insertPosition = 0;
        let currentIndex = 0;
        
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].column === targetColumn) {
                if (currentIndex === insertIndex) {
                    insertPosition = i;
                    break;
                }
                currentIndex++;
            }
        }
        
        if (insertPosition === 0 && currentIndex < insertIndex) {
            insertPosition = this.cards.length;
        }
        
        this.cards.splice(insertPosition, 0, updatedCard);

        this.saveToStorage();
        this.renderCards();
    }

    showAddCardForm(button) {
        const form = button.nextElementSibling;
        const input = form.querySelector('.card-input');
        
        form.style.display = 'block';
        button.style.display = 'none';
        input.focus();
    }

    hideAddCardForm(form) {
        const button = form.previousElementSibling;
        const input = form.querySelector('.card-input');
        
        form.style.display = 'none';
        button.style.display = 'block';
        input.value = '';
    }

    addCard(form) {
        const input = form.querySelector('.card-input');
        const text = input.value.trim();
        
        if (!text) return;

        const column = form.closest('.column').dataset.column;
        const card = {
            id: Date.now().toString(),
            text: text,
            column: column
        };

        this.cards.push(card);
        this.saveToStorage();
        this.renderCards();
        this.hideAddCardForm(form);
    }

    deleteCard(cardId) {
        this.cards = this.cards.filter(c => c.id !== cardId);
        this.saveToStorage();
        this.renderCards();
    }

    renderCards() {
        document.querySelectorAll('.cards-container').forEach(container => {
            container.innerHTML = '';
        });

        this.cards.forEach(card => {
            this.createCardElement(card);
        });
    }

    createCardElement(card) {
        const container = document.querySelector(`[data-cards="${card.column}"]`);
        const cardElement = document.createElement('div');
        
        cardElement.className = 'card';
        cardElement.dataset.cardId = card.id;
        cardElement.draggable = false;
        
        cardElement.innerHTML = `
            <div class="card-content">${this.escapeHtml(card.text)}</div>
            <button class="card-delete">×</button>
        `;

        const deleteBtn = cardElement.querySelector('.card-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCard(card.id);
        });

        container.append(cardElement);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToStorage() {
        localStorage.setItem('trello-board-cards', JSON.stringify(this.cards));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('trello-board-cards');
        return stored ? JSON.parse(stored) : [];
    }
}

let trelloBoard;
document.addEventListener('DOMContentLoaded', () => {
    trelloBoard = new TrelloBoard();
    window.trelloBoard = trelloBoard;
});