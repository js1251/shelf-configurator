import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../../../3d/modelloader";
import { Decor } from "../../decor";

export class PottedPlant02 extends Decor {
    constructor(modelloader: ModelLoader) {
        super(modelloader, 0.4, 1.6);
    }

    protected constructMeshes(): BABYLON.AbstractMesh {
        return this.modelloader.createInstance("models/decor_potted_plant_02.glb", new BABYLON.Vector3(0, 0, 0));
    }
    
    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        return [min, max];
    }

    clone(): Decor {
        return new PottedPlant02(this.modelloader);
    }
}