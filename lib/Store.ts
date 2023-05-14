export default class Store<T> {
    store: T[] = [];
    
    add(item: T | T[]) {
        const items = Array.isArray(item) ? item : [item];
        this.store.push(...items);
        return this;
    }

    remove(item: T | T[]) {
        const items = Array.isArray(item) ? item : [item];
        this.store = this.store.filter(i => !items.includes(i));
        return this;
    }
    
    clear() {
        this.store = [];
        return this;
    }

    get() {
        return this.store;
    }

    has(item: T) {
        return this.store.includes(item);
    }

    size() {
        return this.store.length;
    }

    isEmpty() {
        return this.size() === 0;
    }

    forEach(callback: (item: T, index: number, array: T[]) => void) {
        this.store.forEach(callback);
        return this;
    }
}