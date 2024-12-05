import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../../../3d/modelloader";
import { Decor } from "../../decor";

export class PottedPlant01 extends Decor {
    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }
    
    protected constructMeshes(): BABYLON.AbstractMesh {
        return this.modelloader.createInstance("models/decor_potted_plant_01.glb", new BABYLON.Vector3(0, 0, 0));
    }

    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        min.y = 0;
        max.y -= 0.02;
        
        min.z += 0.05;
        max.z -= 0.1;

        min.x += 0.05;
        max.x -= 0.05;
        
        return [min, max];
    }

    clone(): Decor {
        return new PottedPlant01(this.modelloader);
    }
}