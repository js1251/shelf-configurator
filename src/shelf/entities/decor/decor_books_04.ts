import * as BABYLON from "@babylonjs/core";
import { Decor } from "../../decor";
import { ModelLoader } from "../../../3d/modelloader";

export class Books04 extends Decor {
    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }

    protected constructMeshes(): BABYLON.AbstractMesh {
        return this.modelloader.createInstance("models/decor_books_04.glb");
    }
    
    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        return [min, max];
    }

    clone(): Decor {
        return new Books04(this.modelloader);
    }
}