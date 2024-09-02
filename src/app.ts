import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import * as CAMERA from "./camera";
import * as ENVIRONMENT from "./environment";
import { ModelLoader } from "./modelloader";
import { Shelf } from "./shelf/shelf";
import { Measurements } from "./measurements";

class App {
    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new BABYLON.Engine(canvas, true);
        var scene = new BABYLON.Scene(engine);

        //const environment = scene.createDefaultEnvironment();

        var camera: BABYLON.ArcRotateCamera = CAMERA.createCamera(scene, canvas);
        camera.attachControl(canvas, true);
        
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(-0.5, 1, 0), scene);

        const environment = new ENVIRONMENT.Environment(scene);
        const shadowGenerator = environment.getShadowGenerator();

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
        ];

        const modelLoader = new ModelLoader(scene, shadowGenerator);
        // wait for all models to be loaded and create shelf afterwards
        Promise.all(modelUrls.map(entry => modelLoader.preloadModel(entry.url, entry.material))).then(() => {
            const shelf_root = new BABYLON.Node("shelf_root", scene);
            const shelf = new Shelf(scene, modelLoader, shelf_root);

            let measurements = new Measurements(scene, shelf, camera);

            document.addEventListener("Shelf.Board.Change", (e) => {
                const detail = (e as CustomEvent).detail;
                const board = detail.board;

                measurements.updateBoardMeasurement(board);
            });

            document.addEventListener("Shelf.Board.Grabbed", (e) => {
                const detail = (e as CustomEvent).detail;
                const board = detail.board;

                measurements.enableForBoard(board);
            });

            document.addEventListener("Shelf.Board.Released", (e) => {
                const detail = (e as CustomEvent).detail;
                const board = detail.board;

                measurements.disableForBoard(board);
            });

            document.addEventListener("Shelf.bbox.Change", (e) => {
                const detail = (e as CustomEvent).detail;
                const shelf = detail.shelf;
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