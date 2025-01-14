import * as BABYLON from "@babylonjs/core";
import { Decor } from "../../decor";
import { ModelLoader } from "../../../3d/modelloader";

export class Lamp01 extends Decor {
    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }
    
    protected constructMeshes(): BABYLON.AbstractMesh {
        const light = new BABYLON.SpotLight("lamp01_light", BABYLON.Vector3.Zero(), BABYLON.Vector3.Down(), 160 * Math.PI / 180, 3, this.modelloader.scene);
        const model = this.modelloader.createInstance("models/decor_lamp_01.glb");

        light.position.y += 0.22;
        light.intensity = 0.5;
        light.diffuse = BABYLON.Color3.FromHexString("#E9D092");

        light.parent = model;

        return model;
    }
    
    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        return [min, max];
    }

    clone(): Decor {
        return new Lamp01(this.modelloader);
    }
}