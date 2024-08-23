import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./../modelloader";

export class Strut {
    private height_m: number;
    private offset: number;
    private index: number;

    private scene: BABYLON.Scene;
    private modelloader: ModelLoader;

    private strut: BABYLON.AbstractMesh;
    private footTop: BABYLON.AbstractMesh;
    private footBottom: BABYLON.AbstractMesh;

    private root: BABYLON.Node;

    constructor(scene: BABYLON.Scene, modelloader: ModelLoader, root: BABYLON.Node, height_m: number, offset: number, index: number) {
        this.scene = scene;
        this.modelloader = modelloader;
        this.root = root;
        this.index = index;

        this.spawnStrut();

        this.setHeight(height_m);
        this.setOffset(offset);
    }

    setIndex(index: number) {
        this.index = index;
    }

    getIndex(): number {
        return this.index;
    }

    getHeight(): number {
        return this.height_m;
    }

    setHeight(height_m: number) {
        this.height_m = height_m;

        this.strut.setParent(null);
        this.footTop.setParent(null);
        this.footBottom.setParent(null);

        this.strut.position = new BABYLON.Vector3(this.offset, this.height_m / 2 + 0.05, 0);
        this.strut.scaling.y = this.height_m * 10;
        this.strut.setParent(this.root);

        this.footTop.position = new BABYLON.Vector3(this.offset, this.height_m + 0.05, 0);
        this.footTop.setParent(this.strut);

        this.footBottom.position = new BABYLON.Vector3(this.offset, 0.05, 0);
        this.footBottom.setParent(this.strut);
    }

    getOffset(): number {
        return this.offset;
    }

    setOffset(offset: number) {
        this.offset = offset;

        this.strut.position.x = this.offset;
    }

    getBabylonNode(): BABYLON.AbstractMesh {
        return this.strut;
    }

    remove() {
        this.strut.dispose();
    }

    private spawnStrut() {
        this.strut = this.modelloader.createInstance("models/strut.glb", BABYLON.Vector3.Zero());
        this.strut.setEnabled(true);

        this.footTop = this.modelloader.createInstance("models/foot.glb", BABYLON.Vector3.Zero());
        this.footTop.setEnabled(true);
        this.footTop.setParent(this.strut);

        this.footBottom = this.modelloader.createInstance("models/foot.glb", BABYLON.Vector3.Zero());
        this.footBottom.rotate(BABYLON.Axis.X, Math.PI, BABYLON.Space.LOCAL);
        this.footBottom.setEnabled(true);
        this.footBottom.setParent(this.strut);

        this.scene.addMesh(this.strut);
        this.scene.addMesh(this.footTop);
        this.scene.addMesh(this.footBottom);

        this.strut.setParent(this.root);
    }
}
