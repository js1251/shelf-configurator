import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./../modelloader";
import { Strut } from "./strut";

export class Board {
    private height_m: number;
    private startStrut: Strut;
    private endStrut: Strut;

    private scene: BABYLON.Scene;
    private modelloader: ModelLoader;

    private start: BABYLON.AbstractMesh;
    // TOOD: middle pieces
    private end: BABYLON.AbstractMesh;

    private root: BABYLON.Node;

    constructor(scene: BABYLON.Scene, modelloader: ModelLoader, root: BABYLON.Node, height_m: number, startStrut: Strut, endStrut: Strut) {
        this.scene = scene;
        this.modelloader = modelloader;
        this.root = root;

        this.spawnBoard();

        this.setHeight(height_m);
        this.setStartStrut(startStrut);
        this.setEndStrut(endStrut);
    }

    setHeight(height_m: number) {
        this.height_m = height_m;

        this.start.setParent(null);
        this.start.position.y = this.height_m;
        this.start.setParent(this.root);
    }

    getHeight(): number {
        return this.height_m;
    }

    setStartStrut(startStrut: Strut) {
        this.startStrut = startStrut;

        this.start.setParent(null);
        this.start.position.x = this.startStrut.getBabylonNode().position.clone().x;
        this.start.setParent(this.root);
    }

    getStartStrut(): Strut {
        return this.startStrut;
    }

    setEndStrut(endStrut: Strut) {
        if (this.startStrut === null) {
            throw new Error("Start strut is not set");
        }

        if (endStrut.getIndex() < this.startStrut.getIndex()) {
            throw new Error("End strut must be after start strut");
        }

        if (endStrut.getOffset() < this.startStrut.getOffset()) {
            throw new Error("End strut must be after start strut");
        }

        this.endStrut = endStrut;

        this.end.setParent(null);
        this.end.position.x = this.endStrut.getBabylonNode().position.clone().x;
        this.end.setParent(this.start);

        /*
        const spawnPosition = this.startStrut.getBabylonNode().position.clone();
        spawnPosition.x += 0.1;

        const span = this.endStrut.getIndex() - this.startStrut.getIndex();
        const spacing = (this.endStrut.getOffset() - this.startStrut.getOffset()) / span;

        for (let i = 0; i < span; i++) {
            const stretch = this.modelloader.createInstance("models/shelf_stretch.glb", spawnPosition.clone());

            stretch.scaling.x = (spacing - 0.2) / 0.1;

            stretch.setParent(start);
            stretch.setEnabled(true);
            this.scene.addMesh(stretch);

            spawnPosition.x += spacing - 0.1;

            if (i + 1 != span) {
                const middle = this.modelloader.createInstance("models/shelf_middle.glb", spawnPosition.clone());

                middle.setParent(start);
                middle.setEnabled(true);
                this.scene.addMesh(middle);

                spawnPosition.x += 0.1;
            }
        }
        */
    }

    getEndStrut(): Strut {
        return this.endStrut;
    }

    private spawnBoard() {
        const spawnPosition = BABYLON.Vector3.Zero();

        const start = this.modelloader.createInstance("models/shelf_end.glb", spawnPosition.clone());
        start.setParent(this.root);
        start.setEnabled(true);
        this.scene.addMesh(start);

        this.start = start;

        const end = this.modelloader.createInstance("models/shelf_end.glb", spawnPosition.clone());
        end.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
        end.setParent(start);
        end.setEnabled(true);
        this.scene.addMesh(end);

        this.end = end;
    }
}
