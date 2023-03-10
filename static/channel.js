export class Channel {
    constructor() {
        this.queue = [];
        this.pending = null;
    }

    next() {
        if (this.queue.length === 0) {
            return new Promise((resolve) => {
                this.pending = { resolve };
            });
        } else {
            const value = this.queue.shift();
            return Promise.resolve(value);
        }
    }

    append(message) {
        if (this.pending !== null) {
            const pending = this.pending;
            this.pending = null;
            pending.resolve(message);
        } else {
            this.queue.push(message);
        }
    }
}