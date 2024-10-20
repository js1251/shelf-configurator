import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import * as CAMERA from "./camera";
import * as ENVIRONMENT from "./environment";
import { ModelLoader } from "./modelloader";
import { Shelf } from "./shelf/shelf";
import { Measurements } from "./measurements";
import { DecorBuilder } from "./decor_builder";
import { Navigation3D } from "./navigation_3d";
import { Navigation2D } from "./navigation_2d";

class App {
    private scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.ShadowGenerator;
    private modelLoader: ModelLoader;
    private shelf: Shelf;

    // TODO: Clean up, encapsulate into methods
    // NOTE: If things change at runtime, measurements, decor and navigation3D might not yet be updated
    constructor() {
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        var engine = new BABYLON.Engine(canvas, true, { stencil: true });
        window.addEventListener("resize", () => {
            engine.resize();
        });

        this.scene = new BABYLON.Scene(engine);

        var camera: BABYLON.ArcRotateCamera = CAMERA.createCamera(this.scene, canvas);
        camera.attachControl(canvas, true);
        
        var sun: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("sun", new BABYLON.Vector3(-1, 1, -1), this.scene);
        sun.intensity = 1.3;

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
            const measurements = new Measurements(this.scene, this.shelf, camera);
            const navigation3D = new Navigation3D(this.scene, this.shelf, environment);
            const navigation2D = new Navigation2D(this.shelf);

            navigation3D.BoardSelected.on((board) => {
                measurements.createForBoard(board);
                navigation2D.setSelectedBoard(board);
            });

            navigation3D.BoardDeselected.on((board) => {
                measurements.removeForBoard(board);
                navigation2D.setSelectedBoard(null);
            });

            navigation3D.BoardStoppedDragged.on((board) => {
                if (board.getAllDecor().length === 0) {
                    decor_builder.buildDecorForBoard(board);
                }
            });

            navigation2D.DayNightButtonPressed.on((active) => {
                environment.setNight(active);
                sun.intensity = active ? 0.3 : 1.3;
            });

            navigation2D.DecorButtonPressed.on((active) => {
                decor_builder.setVisibility(active);
            });

            navigation2D.RulerButtonPressed.on((active) => {
                measurements.setVisibility(active);
            });

            this.shelf.BoardChanged.on((board) => {
                measurements.removeForBoard(board);
                measurements.createForBoard(board);

                decor_builder.removeDecorForBoard(board);
                decor_builder.validateNeighborDecorForBoard(board);
            });

            this.shelf.BoardRemoved.on((board) => {
                measurements.removeForBoard(board);
                decor_builder.removeDecorForBoard(board);
                navigation2D.setSelectedBoard(null);
                navigation3D.setSelectedBoard(null);
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
        const shelf = new Shelf(this.modelLoader);
            
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