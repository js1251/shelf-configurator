import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import * as CAMERA from "./camera";
import * as ENVIRONMENT from "./environment";
import { ModelLoader } from "./modelloader";
import { Shelf } from "./shelf/shelf";
import { Measurements } from "./measurements";
import { Board } from "./shelf/board";
import { DecorBuilder } from "./decor_builder";

class App {
    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new BABYLON.Engine(canvas, true, { stencil: true });
        var scene = new BABYLON.Scene(engine);

        var camera: BABYLON.ArcRotateCamera = CAMERA.createCamera(scene, canvas);
        camera.attachControl(canvas, true);
        
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(-0.5, 1, 0), scene);

        const strutMaterial = new BABYLON.StandardMaterial("strut", scene);
        strutMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        strutMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        const woodMaterial = new BABYLON.StandardMaterial("wood", scene);
        woodMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.20, 0.04);
        woodMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

        const modelUrls = [
            {
                url: "models/strut.glb",
                material: strutMaterial
            },
            {
                url: "models/foot.glb",
                material: new BABYLON.StandardMaterial("foot", scene)
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
                material: new BABYLON.StandardMaterial("clamp", scene)
            },
            {
                url: "models/decor_potted_plant_01.glb",
                material: new BABYLON.StandardMaterial("plant", scene)
            },
            {
                url: "models/decor_placeholder.glb",
                material: new BABYLON.StandardMaterial("placeholder", scene)
            },
        ];

        const environment = new ENVIRONMENT.Environment(scene);
        environment.RoomChanged.on((bbox) => {
            camera.position = new BABYLON.Vector3(0, bbox.center.y, bbox.minimum.z);
            camera.target = bbox.center;
        });

        environment.setRoomHeight(2.4);
        environment.setRoomWidth(3.5);
        environment.setRoomDepth(4.5);

        const shadowGenerator = environment.getShadowGenerator();

        const modelLoader = new ModelLoader(scene, shadowGenerator);
        // wait for all models to be loaded and create shelf afterwards
        Promise.all(modelUrls.map(entry => modelLoader.preloadModel(entry.url, entry.material))).then(() => {
            const shelf_root = new BABYLON.TransformNode("shelf_root", scene);
            const shelf = new Shelf(scene, modelLoader, shelf_root);
            const decor_builder = new DecorBuilder(modelLoader, shelf);
            decor_builder.fillDecor();

            let measurements = new Measurements(scene, shelf, camera, shelf_root);

            shelf.BoardChanged.on((board) => {
                measurements.updateBoardMeasurement(board);
            });

            shelf.BoardGrabbed.on((board) => {
                measurements.enableForBoard(board);
            });

            shelf.BoardReleased.on((board) => {
                measurements.disableForBoard(board);
            });

            shelf.PositionChanged.on((position) => {
                position.y = 0;

                // clamp the shelf to the room
                const room_bbox = environment.getBoundingBox();

                if (position.x - Board.BOARD_WIDTH / 2 < room_bbox.minimum.x) {
                    position.x = room_bbox.minimum.x + Board.BOARD_WIDTH / 2;
                } else if (position.x + shelf.getWidth() - Board.BOARD_WIDTH / 2 > room_bbox.maximum.x) {
                    position.x = room_bbox.maximum.x - shelf.getWidth() + Board.BOARD_WIDTH / 2;
                }

                if (position.z - Board.BOARD_WIDTH / 2 < room_bbox.minimum.z) {
                    position.z = room_bbox.minimum.z + Board.BOARD_WIDTH / 2;
                } else if (position.z + shelf.getDepth() - Board.BOARD_WIDTH / 2 > room_bbox.maximum.z) {
                    position.z = room_bbox.maximum.z - shelf.getDepth() + Board.BOARD_WIDTH / 2;
                }

                // move the shelf to the new position
                shelf.setPosition(position);
            });
        });

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'I') {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();