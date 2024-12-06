import { ILiteEvent } from "./ILiteEvent";

export class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { (data?: T): void; }[] = [];
    private supressed: boolean = false;

    public on(handler: { (data?: T): void }) : void {
        this.handlers.push(handler);
    }

    public off(handler: { (data?: T): void }) : void {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    public trigger(data?: T) {
        if (this.supressed) {
            return;
        }

        this.handlers.slice(0).forEach(h => h(data));
    }

    public expose() : ILiteEvent<T> {
        return this;
    }

    public supress() {
        this.supressed = true;
    }

    public unsupress() {
        this.supressed = false;
    }
}