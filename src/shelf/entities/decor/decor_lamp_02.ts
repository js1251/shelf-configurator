import * as BABYLON from "@babylonjs/core";
import { Decor } from "../../decor";
import { ModelLoader } from "../../../3d/modelloader";

export class Lamp02 extends Decor {
    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }
    
    protected constructMeshes(): BABYLON.AbstractMesh {
        const light = new BABYLON.PointLight("lamp02_light", BABYLON.Vector3.Zero(), this.modelloader.scene);
        const model = this.modelloader.createInstance("models/decor_lamp_02.glb");

        light.position.y += 0.18;
        light.intensity = 0.5;
        light.diffuse = BABYLON.Color3.FromHexString("#E9D092");

        light.parent = model;

        return model;
    }
    
    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        return [min, max];
    }

    clone(): Decor {
        return new Lamp02(this.modelloader);
    }
}