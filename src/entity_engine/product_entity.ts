import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../3d/modelloader";
import { Entity } from "./entity";

export abstract class ProductEntity extends Entity {
    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }

    abstract get price(): number;

    abstract get name(): string;

    abstract get description(): string;

    abstract get imageUrls(): string[];

    abstract get shopUrl(): string;

    abstract setMaterial(material: BABYLON.Material);
}