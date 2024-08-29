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
    private middles: BABYLON.AbstractMesh[] = [];
    private stretches: BABYLON.AbstractMesh[] = [];
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

        this.end.setParent(null);
        for (var i = 0; i < this.middles.length; i++) {
            this.middles[i].setParent(null);
        }
        for (var i = 0; i < this.stretches.length; i++) {
            this.stretches[i].setParent(null);
        }

        this.start.setParent(null);
        this.start.position.x = this.startStrut.getBabylonNode().position.clone().x;
        this.start.setParent(this.root);

        this.end.setParent(this.start);

        this.handleMiddle();
    }

    getStartStrut(): Strut {
        return this.startStrut;
    }

    setEndStrut(endStrut: Strut) {
        this.endStrut = endStrut;

        this.end.setParent(null);
        this.end.position.x = this.endStrut.getBabylonNode().position.clone().x;
        this.end.setParent(this.start);
        
        this.handleMiddle();
    }

    getEndStrut(): Strut {
        return this.endStrut;
    }

    remove() {
        this.start.dispose();
    }

    getBabylonNode(): BABYLON.AbstractMesh {
        return this.start;
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

    private handleMiddle() {
        if (this.startStrut === undefined || this.endStrut === undefined) {
            return;
        }

        const span = this.endStrut.getIndex() - this.startStrut.getIndex();
        const spacing = (this.endStrut.getOffset() - this.startStrut.getOffset()) / span;

        const requiredMiddles = span - 1;
        const requiredStretches = span;

        // if there are too many middles, remove the last one
        while (this.middles.length > requiredMiddles) {
            this.middles.pop().dispose();
        }

        // if there are too few middles, add more
        while (this.middles.length < requiredMiddles) {
            const middle = this.modelloader.createInstance("models/shelf_middle.glb", BABYLON.Vector3.Zero());

            middle.setParent(this.start);
            middle.setEnabled(true);

            this.scene.addMesh(middle);
            this.middles.push(middle);
        }

        for (var i = 0; i < this.middles.length; i++) {
            const middle = this.middles[i];
            
            middle.setParent(null);
            middle.position = new BABYLON.Vector3(this.startStrut.getOffset() + spacing * (i + 1), this.height_m, 0);
            middle.setParent(this.start);
        }
        
        // if there are too many stretches, remove the last one
        while (this.stretches.length > requiredStretches) {
            this.stretches.pop().dispose();
        }

        // if there are too few stretches, add more
        while (this.stretches.length < requiredStretches) {
            const stretch = this.modelloader.createInstance("models/shelf_stretch.glb", BABYLON.Vector3.Zero());

            stretch.setParent(this.start);
            stretch.setEnabled(true);
    
            this.scene.addMesh(stretch);
            this.stretches.push(stretch);
        }

        for (var i = 0; i < this.stretches.length; i++) {
            const stretch = this.stretches[i];
            
            stretch.setParent(null);
            stretch.position = new BABYLON.Vector3(this.startStrut.getOffset() + spacing * i + 0.1, this.height_m, 0);
            stretch.scaling.x = (spacing - 0.2)/ 0.1;
            stretch.setParent(this.start);
        }
    }
}
