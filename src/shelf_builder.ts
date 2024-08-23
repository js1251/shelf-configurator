import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./modelloader";
import { Shelf } from "./shelf/shelf";

export class shelf_builder {
    private scene: BABYLON.Scene;
    private center: BABYLON.Vector3;
    private modelloader: ModelLoader;

    private shelf: Shelf;

    private root: BABYLON.Node;

    private struts: BABYLON.AbstractMesh[] = [];
    private boards: BABYLON.AbstractMesh[] = [];

    constructor(scene: BABYLON.Scene, modelloader: ModelLoader, center: BABYLON.Vector3, shelf: Shelf) {
        this.scene = scene;
        this.modelloader = modelloader;
        this.center = center;
        this.shelf = shelf;

        this.root = new BABYLON.Node("shelf_root", scene);
    }

    getBoundingBox(): BABYLON.BoundingBox {
        const width = this.shelf.getStruts().length * this.shelf.getStrutSpacing() + 0.2;
        const depth = 0.2;
        const height = this.shelf.getHeight();

        const min = new BABYLON.Vector3(this.center.x - width / 2, 0, this.center.z - depth / 2);
        const max = new BABYLON.Vector3(this.center.x + width / 2, height, this.center.z + depth / 2);

        return new BABYLON.BoundingBox(min, max);
    }

    private addShelf(height: number, startStrut: number, endStrut: number) {
        if (startStrut < 0 || startStrut >= this.shelf.getStruts().length) {
            throw new Error("Invalid start strut");
        }

        if (endStrut < 0 || endStrut >= this.shelf.getStruts().length) {
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
        const spacing = this.shelf.getStrutSpacing();
        for (let i = 0; i < span; i++) {
            const stretch = this.modelloader.createInstance("models/shelf_stretch.glb", BABYLON.Vector3.Zero());
            stretch.position = spawnPosition.clone();

            stretch.scaling.x = (spacing - 0.2) / 0.1;

            stretch.setParent(start);
            stretch.setEnabled(true);
            this.scene.addMesh(stretch);

            spawnPosition.x += spacing - 0.1;

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

        this.boards.push(start);

        // Create pointerDragBehavior in the desired mode
        //var pointerDragBehavior = new BABYLON.PointerDragBehavior({});
        //var pointerDragBehavior = new BABYLON.PointerDragBehavior({dragPlaneNormal: new BABYLON.Vector3(0,1,0)});
        var pointerDragBehavior = new BABYLON.PointerDragBehavior({ dragAxis: new BABYLON.Vector3(0, 1, 0) });

        // Use drag plane in world space
        pointerDragBehavior.useObjectOrientationForDragging = false;
        pointerDragBehavior.moveAttached = false;

        // Listen to drag events
        pointerDragBehavior.onDragStartObservable.add((event) => {
            console.log("dragStart");
            console.log(event);
        });
        pointerDragBehavior.onDragObservable.add((event) => {
            // find the board that is being dragged
            var board = event.pointerInfo.pickInfo.pickedMesh;
            console.log(board);
        });
        pointerDragBehavior.onDragEndObservable.add((event) => {
            console.log("dragEnd");
            console.log(event);
        });

        // If handling drag events manually is desired, set move attached to false
        // pointerDragBehavior.moveAttached = false;

        start.addBehavior(pointerDragBehavior);
    }
}
