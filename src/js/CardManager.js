export default class CardManager {
  constructor(storage) {
    this.storage = storage;
    this.cards = storage.load();
  }

  addCard(text, column) {
    const card = {
      id: Date.now().toString(),
      text: text,
      column: column,
    };
    this.cards.push(card);
    this.save();
    return card;
  }

  deleteCard(cardId) {
    this.cards = this.cards.filter((c) => c.id !== cardId);
    this.save();
  }

  moveCard(cardId, targetColumn, targetIndex) {
    const cardIndex = this.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = this.cards[cardIndex];

    const updatedCard = {
      id: card.id,
      text: card.text,
      column: targetColumn,
    };

    this.cards.splice(cardIndex, 1);

    const targetCards = this.cards.filter((c) => c.column === targetColumn);

    const insertIndex = Math.max(
      0,
      Math.min(targetIndex, targetCards.length),
    );

    targetCards.splice(insertIndex, 0, updatedCard);

    const otherCards = this.cards.filter((c) => c.column !== targetColumn);
    this.cards = otherCards.concat(targetCards);

    this.save();
    return true;
  }

  getAllCards() {
    return this.cards;
  }

  save() {
    this.storage.save(this.cards);
  }

  static escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
