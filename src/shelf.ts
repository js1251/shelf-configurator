import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./modelloader";

export class Shelf {
    private root: BABYLON.Node;
    
    private struts: BABYLON.AbstractMesh[] = [];
    private shelves: BABYLON.AbstractMesh[] = [];

    private scene: BABYLON.Scene;
    private center: BABYLON.Vector3;
    private modelloader: ModelLoader;

    private height: number;
    private spacing: number;

    constructor(scene: BABYLON.Scene, modelloader: ModelLoader, center: BABYLON.Vector3) {
        this.scene = scene;
        this.center = center;
        this.modelloader = modelloader;

        this.root = new BABYLON.Node("shelf_root", scene);
    }

    getBoundingBox(): BABYLON.BoundingBox {
        const width = this.struts.length * this.spacing + 0.2;
        const depth = 0.2;
        const height = this.height;

        const min = new BABYLON.Vector3(this.center.x - width / 2, 0, this.center.z - depth / 2);
        const max = new BABYLON.Vector3(this.center.x + width / 2, height, this.center.z + depth / 2);

        return new BABYLON.BoundingBox(min, max);
    }

    setStruts(height: number, spacing: number, amount: number) {
        this.height = height;
        this.height -= 0.05 * 2; // feet top and bottom

        this.spacing = spacing;

        for (let i = 0; i < amount; i++) {
            const xPosition = this.center.x - (amount - 1) * this.spacing / 2 + i * this.spacing;
            
            const strut = this.spawnStrut(this.height, xPosition);
            this.struts.push(strut);

            strut.setParent(this.root);

            strut.renderOutline = true;
        }

        this.triggerOnShelfChange();
    }

    addShelf(height: number, startStrut: number, endStrut: number) {
        if (startStrut < 0 || startStrut >= this.struts.length) {
            throw new Error("Invalid start strut");
        }

        if (endStrut < 0 || endStrut >= this.struts.length) {
            throw new Error("Invalid end strut");
        }

        if (startStrut > endStrut) {
            throw new Error("Start strut must be before end strut");
        }

        const spawnPosition = this.struts[startStrut].position.clone();
        spawnPosition.y = height;
        
        const start = this.modelloader.createInstance("models/shelf_end.glb", BABYLON.Vector3.Zero());
        start.position = spawnPosition.clone();
        start.setParent(this.root);
        start.setEnabled(true);
        this.scene.addMesh(start);
        
        spawnPosition.x += 0.1;

        const span = endStrut - startStrut;
        for (let i = 0; i < span; i++) {
            const stretch = this.modelloader.createInstance("models/shelf_stretch.glb", BABYLON.Vector3.Zero());
            stretch.position = spawnPosition.clone();

            stretch.scaling.x = (this.spacing - 0.2) / 0.1;

            stretch.setParent(start);
            stretch.setEnabled(true);
            this.scene.addMesh(stretch);

            spawnPosition.x += this.spacing - 0.1;

            if (i + 1 != span) {
                const middle = this.modelloader.createInstance("models/shelf_middle.glb", BABYLON.Vector3.Zero());
                middle.position = spawnPosition.clone();

                middle.setParent(start);
                middle.setEnabled(true);
                this.scene.addMesh(middle);

                spawnPosition.x += 0.1;
            }
        }

        const end = this.modelloader.createInstance("models/shelf_end.glb", BABYLON.Vector3.Zero());
        end.position = spawnPosition.clone();
        end.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
        end.setParent(start);
        end.setEnabled(true);
        this.scene.addMesh(end);
        this.shelves.push(start);

        this.triggerOnShelfChange();
    }

    private spawnStrut(height: number, xPosition: number): BABYLON.AbstractMesh {
        const strut = this.modelloader.createInstance("models/strut.glb", BABYLON.Vector3.Zero());  
        const footTop = this.modelloader.createInstance("models/foot.glb", BABYLON.Vector3.Zero());
        const footBottom = this.modelloader.createInstance("models/foot.glb", BABYLON.Vector3.Zero());

        if (strut && footTop && footBottom) {
            strut.setEnabled(true);
            footTop.setEnabled(true);
            footBottom.setEnabled(true);

            strut.scaling.y = height * 10;
            strut.position.y = height / 2 + 0.05;
            strut.translate(new BABYLON.Vector3(xPosition, 0, 0), 1);

            footTop.translate(new BABYLON.Vector3(xPosition, height + 0.05, 0), 1);
            footTop.setParent(strut);

            footBottom.translate(new BABYLON.Vector3(xPosition, 0.05, 0), 1);
            footBottom.rotate(BABYLON.Axis.X, Math.PI, BABYLON.Space.LOCAL);
            footBottom.setParent(strut);

            this.scene.addMesh(strut);
            this.scene.addMesh(footTop);
            this.scene.addMesh(footBottom);

            return strut;
        } else {
            throw new Error("Failed to spawn strut");
        }
    }

    private triggerOnShelfChange(): void {
        document.dispatchEvent(new CustomEvent("shelfChange", { detail: this.getBoundingBox() }));
    }
}