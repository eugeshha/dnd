import Storage from "./Storage.js";
import CardManager from "./CardManager.js";
import DragAndDrop from "./DragAndDrop.js";

class TrelloBoard {
  constructor() {
    this.storage = new Storage();
    this.cardManager = new CardManager(this.storage);
    this.dragAndDrop = new DragAndDrop(this.cardManager, () =>
      this.renderCards(),
    );

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderCards();
    this.dragAndDrop.bindEvents();
  }

  bindEvents() {
    document.querySelectorAll(".add-card-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.showAddCardForm(e.target));
    });

    document.querySelectorAll(".add-card-form").forEach((form) => {
      const submitBtn = form.querySelector(".add-card-submit");
      const cancelBtn = form.querySelector(".add-card-cancel");
      const input = form.querySelector(".card-input");

      submitBtn.addEventListener("click", () => this.addCard(form));
      cancelBtn.addEventListener("click", () => this.hideAddCardForm(form));

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.addCard(form);
        } else if (e.key === "Escape") {
          this.hideAddCardForm(form);
        }
      });
    });
  }

  showAddCardForm(button) {
    const form = button.nextElementSibling;
    const input = form.querySelector(".card-input");

    form.style.display = "block";
    button.style.display = "none";
    input.focus();
  }

  hideAddCardForm(form) {
    const button = form.previousElementSibling;
    const input = form.querySelector(".card-input");

    form.style.display = "none";
    button.style.display = "block";
    input.value = "";
  }

  addCard(form) {
    const input = form.querySelector(".card-input");
    const text = input.value.trim();

    if (!text) return;

    const column = form.closest(".column").dataset.column;
    this.cardManager.addCard(text, column);
    this.renderCards();
    this.hideAddCardForm(form);
  }

  deleteCard(cardId) {
    this.cardManager.deleteCard(cardId);
    this.renderCards();
  }

  renderCards() {
    document.querySelectorAll(".cards-container").forEach((container) => {
      container.innerHTML = "";
    });

    const cards = this.cardManager.getAllCards();
    cards.forEach((card) => {
      this.createCardElement(card);
    });
  }

  createCardElement(card) {
    const container = document.querySelector(`[data-cards="${card.column}"]`);
    const cardElement = document.createElement("div");

    cardElement.className = "card";
    cardElement.dataset.cardId = card.id;
    cardElement.draggable = false;

    cardElement.innerHTML = `
      <div class="card-content">${CardManager.escapeHtml(card.text)}</div>
      <button class="card-delete">×</button>
    `;

    const deleteBtn = cardElement.querySelector(".card-delete");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.deleteCard(card.id);
    });

    container.append(cardElement);
  }
}

let trelloBoard;
document.addEventListener("DOMContentLoaded", () => {
  trelloBoard = new TrelloBoard();
  window.trelloBoard = trelloBoard;
});
