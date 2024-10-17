import * as BABYLON from "@babylonjs/core";
import { Entity } from './entity';

export class ExampleEntity extends Entity {
    protected constructMeshes(): BABYLON.AbstractMesh {
        const instance = this.modelloader.createInstance("models/decor_potted_plant_02.glb", new BABYLON.Vector3(0, 0, 0));

        return instance;
    }

    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        return [min, max];
    }
}