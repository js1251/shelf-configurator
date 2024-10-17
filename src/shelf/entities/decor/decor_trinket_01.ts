import * as BABYLON from "@babylonjs/core";
import { Decor } from "../../decor";
import { ModelLoader } from "../../../modelloader";

export class Trinket01 extends Decor {
    constructor(modelloader: ModelLoader) {
        super(modelloader, 0.4, 1.6);
    }
    
    protected constructMeshes(): BABYLON.AbstractMesh {
        return this.modelloader.createInstance("models/decor_trinket_01.glb", new BABYLON.Vector3(0, 0, 0));
    }
    
    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        return [min, max];
    }

    clone(): Decor {
        return new Trinket01(this.modelloader);
    }
}