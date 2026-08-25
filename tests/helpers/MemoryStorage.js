export class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
    this.writes = [];
    this.removals = [];
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    const stringValue = String(value);
    this.writes.push({ key, value: stringValue });
    this.values.set(key, stringValue);
  }

  removeItem(key) {
    this.removals.push(key);
    this.values.delete(key);
  }
}
