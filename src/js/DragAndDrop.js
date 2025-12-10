export default class DragAndDrop {
  constructor(cardManager, onCardMoved) {
    this.cardManager = cardManager;
    this.onCardMoved = onCardMoved;
    this.draggedCard = null;
    this.draggedFromColumn = null;
    this.draggedFromIndex = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.originalCardHeight = null;
    this.lastMouseEvent = null;
  }

  bindEvents() {
    document.addEventListener("mousedown", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;

      if (e.target.classList.contains("card-delete")) {
        return;
      }

      e.preventDefault();
      this.startDrag(card, e);
    });

    document.addEventListener("mousemove", (e) => this.drag(e));
    document.addEventListener("mouseup", (e) => this.endDrag(e));
  }

  startDrag(card, e) {
    this.draggedCard = card;
    this.draggedFromColumn = card.closest(".column").dataset.column;
    this.draggedFromIndex = Array.from(card.parentNode.children).indexOf(card);

    const rect = card.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    this.originalCardHeight = card.offsetHeight;

    card.classList.add("dragging");
    card.style.position = "fixed";
    card.style.pointerEvents = "none";
    card.style.zIndex = "1000";
    card.style.width = "250px";
    card.style.maxWidth = "250px";
    card.style.cursor = "grabbing";

    document.body.style.cursor = "grabbing";

    this.isDragging = true;
    this.updateCardPosition(e);
  }

  drag(e) {
    if (!this.draggedCard || !this.isDragging) return;

    this.lastMouseEvent = e;
    this.updateCardPosition(e);
    this.updateDropIndicator(e);
  }

  updateCardPosition(e) {
    this.draggedCard.style.left = `${e.clientX - this.dragOffset.x}px`;
    this.draggedCard.style.top = `${e.clientY - this.dragOffset.y}px`;
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
    const columns = document.querySelectorAll(".column");

    for (const column of columns) {
      const rect = column.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const cardsContainer = column.querySelector(".cards-container");
        if (!cardsContainer) continue;

        const cards = Array.from(cardsContainer.children).filter(
          (card) =>
            !card.classList.contains("drop-placeholder") &&
            !card.classList.contains("dragging"),
        );

        if (cards.length === 0) {
          return { column: column.dataset.column, index: 0 };
        }

        const columnId = column.dataset.column;
        const cardsContainerRect = cardsContainer.getBoundingClientRect();

        for (let i = 0; i < cards.length; i++) {
          const cardRect = cards[i].getBoundingClientRect();
          const cardCenter = cardRect.top + cardRect.height / 2;
          if (e.clientY < cardCenter) {
            return { column: columnId, index: i };
          }
        }

        const lastCard = cards[cards.length - 1];
        const lastCardRect = lastCard.getBoundingClientRect();
        const lastCardBottom = lastCardRect.top + lastCardRect.height;

        if (
          e.clientY >= lastCardBottom ||
          e.clientY >= cardsContainerRect.bottom
        ) {
          return { column: columnId, index: cards.length };
        }

        return { column: columnId, index: cards.length };
      }
    }

    return null;
  }

  showDropIndicator(columnId, index) {
    const column = document.querySelector(`[data-column="${columnId}"]`);
    if (!column) return;

    const cardsContainer = column.querySelector(".cards-container");
    if (!cardsContainer) return;

    const cards = Array.from(cardsContainer.children).filter(
      (card) =>
        !card.classList.contains("drop-placeholder") &&
        !card.classList.contains("dragging"),
    );

    this.hideAllDropIndicators();

    const placeholder = this.createPlaceholder();

    if (cards.length === 0 || index >= cards.length) {
      cardsContainer.append(placeholder);
    } else {
      const targetCard = cards[index];
      if (targetCard && targetCard.parentNode) {
        targetCard.before(placeholder);
      }
    }
  }

  createPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "drop-placeholder";

    if (this.originalCardHeight) {
      placeholder.style.height = `${this.originalCardHeight}px`;
    } else {
      placeholder.style.height = "40px";
    }

    placeholder.style.background = "#ccc";
    placeholder.style.borderRadius = "2px";
    placeholder.style.marginBottom = "6px";
    placeholder.style.opacity = "0.5";
    return placeholder;
  }

  hideAllDropIndicators() {
    document.querySelectorAll(".drop-placeholder").forEach((placeholder) => {
      placeholder.remove();
    });
  }

  hideDropIndicator() {
    this.hideAllDropIndicators();
  }

  endDrag(e) {
    if (!this.draggedCard || !this.isDragging) return;

    const mouseEvent = e || this.lastMouseEvent;
    if (!mouseEvent) {
      this.resetDragState();
      return;
    }

    const dropTarget = this.getDropTarget(mouseEvent);

    if (dropTarget) {
      const cardId = this.draggedCard.dataset.cardId;
      const moved = this.cardManager.moveCard(
        cardId,
        dropTarget.column,
        dropTarget.index,
      );

      if (moved && this.onCardMoved) {
        this.onCardMoved();
      }
    }

    this.resetDragState();
  }

  resetDragState() {
    if (this.draggedCard) {
      this.draggedCard.classList.remove("dragging");
      this.draggedCard.style.position = "";
      this.draggedCard.style.left = "";
      this.draggedCard.style.top = "";
      this.draggedCard.style.pointerEvents = "";
      this.draggedCard.style.zIndex = "";
      this.draggedCard.style.width = "";
      this.draggedCard.style.maxWidth = "";
      this.draggedCard.style.cursor = "";
    }

    document.body.style.cursor = "";

    this.hideDropIndicator();
    this.draggedCard = null;
    this.draggedFromColumn = null;
    this.draggedFromIndex = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.originalCardHeight = null;
    this.lastMouseEvent = null;
  }
}
