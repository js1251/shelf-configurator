import { ModelLoader } from "../modelloader";
import { Entity } from "../entity_engine/entity";

export abstract class Decor extends Entity {
    private minHeight: number;
    private maxHeight: number;

    constructor(modelloader: ModelLoader, minHeight: number = 0.0, maxHeight: number = -1.0) {
        super(modelloader);

        this.minHeight = minHeight;
        this.maxHeight = maxHeight;
    }

    getMinHeight(): number {
        return this.minHeight;
    }

    getMaxHeight(): number {
        return this.maxHeight;
    }

    abstract clone(): Decor;
}