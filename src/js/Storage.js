export default class Storage {
  save(cards) {
    localStorage.setItem("trello-board-cards", JSON.stringify(cards));
  }

  load() {
    const stored = localStorage.getItem("trello-board-cards");
    return stored ? JSON.parse(stored) : [];
  }
}
