import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import * as CAMERA from "./camera";
import * as ENVIRONMENT from "./environment";
import { ModelLoader } from "./modelloader";
import { Shelf } from "./shelf";

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

        var camera: BABYLON.Camera = CAMERA.createCamera(scene, canvas);
        camera.attachControl(canvas, true);
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(-1, 1, 0), scene);

        var sphere: BABYLON.Mesh = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        sphere.position.y = 0.5;

        const shadowGenerator = ENVIRONMENT.createEnvironment(scene);
        shadowGenerator.getShadowMap().renderList.push(sphere);

        const modelLoader = new ModelLoader(scene);

        // Preload the models
        const modelUrl1 = "models/strut.glb";

        const shelf = new Shelf(scene, modelLoader, new BABYLON.Vector3(0, 0, 0));
        modelLoader.preloadModel(modelUrl1).then(() => {
            shelf.setBeams(5, 5);
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