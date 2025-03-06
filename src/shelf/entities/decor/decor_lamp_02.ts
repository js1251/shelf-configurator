import * as BABYLON from "@babylonjs/core";
import { Decor } from "../../decor";
import { ModelLoader } from "../../../3d/modelloader";
import { LightEmittingDecor } from "../../light_emitting_decor";

export class Lamp02 extends LightEmittingDecor {
    private light: BABYLON.PointLight;
    
    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }
    
    protected constructMeshes(): BABYLON.AbstractMesh {
        return this.modelloader.createInstance("models/decor_lamp_02.glb");
    }

    constructLight(): BABYLON.Light {
        const light = new BABYLON.PointLight("lamp02_light", BABYLON.Vector3.Zero(), this.modelloader.scene);
    
        light.position.y += 0.18;
        light.intensity = 0.5;
        light.diffuse = BABYLON.Color3.FromHexString("#E9D092");

        light.parent = this.root;

        return light;
    }

    turnOn(): void {
        this.light.setEnabled(true);
    }

    turnOff(): void {
        this.light.setEnabled(false);
    }
    
    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        return [min, max];
    }

    clone(): Decor {
        return new Lamp02(this.modelloader);
    }
}