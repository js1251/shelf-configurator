import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import * as CAMERA from "./camera";
import * as ENVIRONMENT from "./environment";
import { ModelLoader } from "./modelloader";
import { Shelf } from "./shelf/shelf";
import { Board } from "./shelf/entities/board";
import { PottedPlant01 } from "./shelf/entities/decor/potted_plant01";
import { Measurements } from "./measurements";
import { DecorBuilder } from "./decor_builder";
//import { Measurements } from "./measurements";

class App {
    private scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.ShadowGenerator;
    private modelLoader: ModelLoader;
    private shelf: Shelf;

    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new BABYLON.Engine(canvas, true, { stencil: true });
        this.scene = new BABYLON.Scene(engine);

        var camera: BABYLON.ArcRotateCamera = CAMERA.createCamera(this.scene, canvas);
        camera.attachControl(canvas, true);
        
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(-0.5, 1, 0), this.scene);

        const environment = new ENVIRONMENT.Environment(this.scene);
        environment.RoomChanged.on((bbox) => {
            camera.position = new BABYLON.Vector3(0, bbox.center.y, bbox.minimum.z);
            camera.target = bbox.center;
        });

        environment.setRoomHeight(2.4);
        environment.setRoomWidth(3.5);
        environment.setRoomDepth(4.5);

        this.shadowGenerator = environment.getShadowGenerator();

        this.modelLoader = new ModelLoader(this.scene, this.shadowGenerator);
        // wait for all models to be loaded and create shelf afterwards
        this.loadModels().then(() => {
            this.shelf = this.createShelf();

            const decor_builder = new DecorBuilder(this.modelLoader, this.shelf);
            decor_builder.fillDecor();

            let measurements = new Measurements(this.scene, this.shelf, camera);

            this.shelf.BoardChanged.on((board) => {
                measurements.updateBoardMeasurement(board);
                decor_builder.disableDecorForBoard(board);
                decor_builder.validateDecorForBoard(board);
            });

            this.shelf.BoardGrabbed.on((board) => {
                measurements.enableForBoard(board);
            });

            this.shelf.BoardReleased.on((board) => {
                measurements.disableForBoard(board);
                decor_builder.enableDecorForBoard(board);
            });

            this.shelf.PositionChanged.on((position) => {
                position.y = 0;

                // clamp the shelf to the room
                const room_bbox = environment.getBoundingBox();

                if (position.x - Board.BOARD_WIDTH / 2 < room_bbox.minimum.x) {
                    position.x = room_bbox.minimum.x + Board.BOARD_WIDTH / 2;
                } else if (position.x + this.shelf.getWidth() - Board.BOARD_WIDTH / 2 > room_bbox.maximum.x) {
                    position.x = room_bbox.maximum.x - this.shelf.getWidth() + Board.BOARD_WIDTH / 2;
                }

                if (position.z - Board.BOARD_WIDTH / 2 < room_bbox.minimum.z) {
                    position.z = room_bbox.minimum.z + Board.BOARD_WIDTH / 2;
                } else if (position.z + this.shelf.getDepth() - Board.BOARD_WIDTH / 2 > room_bbox.maximum.z) {
                    position.z = room_bbox.maximum.z - this.shelf.getDepth() + Board.BOARD_WIDTH / 2;
                }

                // move the shelf to the new position
                this.shelf.setPosition(position);
            });
        });

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'I') {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    private loadModels() : Promise<void[]> {
        const strutMaterial = new BABYLON.StandardMaterial("strut", this.scene);
        strutMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        strutMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        const woodMaterial = new BABYLON.StandardMaterial("wood", this.scene);
        woodMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.20, 0.04);
        woodMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

        const modelUrls = [
            {
                url: "models/strut.glb",
                material: strutMaterial
            },
            {
                url: "models/foot.glb",
                material: new BABYLON.StandardMaterial("foot", this.scene)
            },
            {
                url: "models/shelf_end.glb",
                material: woodMaterial
            },
            {
                url: "models/shelf_middle.glb",
                material: woodMaterial
            },
            {
                url: "models/shelf_stretch.glb",
                material: woodMaterial
            },
            {
                url: "models/clamp.glb",
                material: new BABYLON.StandardMaterial("clamp", this.scene)
            },
            {
                url: "models/decor_potted_plant_01.glb",
                material: new BABYLON.StandardMaterial("plant01", this.scene)
            },
            {
                url: "models/decor_potted_plant_02.glb",
                material: new BABYLON.StandardMaterial("plant02", this.scene)
            },
            {
                url: "models/decor_placeholder.glb",
                material: new BABYLON.StandardMaterial("placeholder", this.scene)
            },
            {
                url: "models/decor_books_01.glb",
                material: new BABYLON.StandardMaterial("books01", this.scene)
            },
            {
                url: "models/decor_books_02.glb",
                material: new BABYLON.StandardMaterial("books02", this.scene)
            },
            {
                url: "models/decor_books_03.glb",
                material: new BABYLON.StandardMaterial("books03", this.scene)
            },
            {
                url: "models/decor_books_04.glb",
                material: new BABYLON.StandardMaterial("books04", this.scene)
            },
            {
                url: "models/decor_trinket_01.glb",
                material: new BABYLON.StandardMaterial("trinket01", this.scene)
            },
        ];

        // return a promise that resolves when all models are loaded
        return Promise.all(modelUrls.map(entry => this.modelLoader.preloadModel(entry.url, entry.material)));
    }

    private createShelf() : Shelf {
        const shelf = new Shelf(this.scene, this.modelLoader);
            
        shelf.setHeight(2.4);

        shelf.addStrutToEnd();
        shelf.addStrutToEnd();
        shelf.addStrutToEnd();
        shelf.addStrutToEnd();
            
        shelf.setStrutSpacing(0.5);
        
        shelf.addBoard(0.35, 1, 3);
        shelf.addBoard(0.77, 0, 2);
        shelf.addBoard(0.99, 2, 3);
        shelf.addBoard(1.21, 1, 2);
        shelf.addBoard(1.43, 2, 3);
        shelf.addBoard(1.65, 0, 2);
        shelf.addBoard(2.07, 1, 3);

        return shelf;
    }
}

new App();