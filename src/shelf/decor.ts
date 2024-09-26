import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../modelloader";

export class Decor {
    private modelloader: ModelLoader;
    private url: string;

    private minHeight: number;
    private maxHeight: number;

    private node: BABYLON.AbstractMesh;

    constructor(modelloader: ModelLoader, url: string, minHeight: number = 0.0, maxHeight: number = -1.0) {
        this.modelloader = modelloader;
        this.url = url;

        this.minHeight = minHeight;
        this.maxHeight = maxHeight;

        this.node = this.modelloader.createInstance(url, BABYLON.Vector3.Zero());
    }

    getMinHeight(): number {
        return this.minHeight;
    }

    getMaxHeight(): number {
        return this.maxHeight;
    }

    getBabylonNode(): BABYLON.AbstractMesh {
        return this.node;
    }

    getBoundingBox(): BABYLON.BoundingBox {
        const bbox = this.node.getBoundingInfo().boundingBox;

        this.node.getChildMeshes().forEach((mesh) => {
            const childBbox = mesh.getBoundingInfo().boundingBox;
            bbox.reConstruct(childBbox.minimumWorld, childBbox.maximumWorld);
        });

        const meshWidth = bbox.extendSizeWorld.x;
        const meshDepth = bbox.extendSizeWorld.z;

        const min = new BABYLON.Vector3(-meshWidth, 0, -meshDepth).add(this.node.position);
        const max = new BABYLON.Vector3(meshWidth, bbox.maximum.y, meshDepth).add(this.node.position);

        return new BABYLON.BoundingBox(min, max);
    }

    clone(): Decor {
        return new Decor(this.modelloader, this.url, this.minHeight, this.maxHeight);
    }
}