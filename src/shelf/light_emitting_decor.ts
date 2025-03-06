import * as BABYLON from "@babylonjs/core";
import { Decor } from "./decor";
import { ModelLoader } from "../3d/modelloader";

export abstract class LightEmittingDecor extends Decor {
    constructor(modelloader: ModelLoader) {
        super(modelloader);

        
        // this.constructLight();
    }

    abstract constructLight(): BABYLON.Light;
    
    abstract turnOn(): void;
    abstract turnOff(): void;
}