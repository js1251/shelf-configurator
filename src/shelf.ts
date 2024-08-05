import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./modelloader";

export class Shelf {
    private struts: BABYLON.AbstractMesh[] = [];
    private shelves: BABYLON.AbstractMesh[] = [];

    private scene: BABYLON.Scene;
    private center: BABYLON.Vector3;
    private modelloader: ModelLoader;

    constructor(scene: BABYLON.Scene, modelloader: ModelLoader, center: BABYLON.Vector3) {
        this.scene = scene;
        this.center = center;
        this.modelloader = modelloader;
    }

    // beam setup function
    setBeams(height: number, amount: number) {
        // spawn beams
        for (let i = 0; i < amount; i++) {
            const strut = this.spawnStrut();
            strut.scaling.y = height;
            strut.position.x = this.center.x + i * 2 - amount;
            strut.position.y = height / 2;
            strut.position.z = this.center.z;
            this.struts.push(strut);
        }

        // add to scene
        this.struts.forEach((strut) => {
            this.scene.addMesh(strut);
        });
    }

    // spawn helper
    private spawnStrut(): BABYLON.AbstractMesh {
        const strut = this.modelloader.createInstance("models/strut.glb", this.center);
        if (strut) {
            strut.setEnabled(true);
            return strut;
        } else {
            throw new Error("Failed to spawn strut");
        }
    }
}