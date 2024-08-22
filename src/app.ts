import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import * as CAMERA from "./camera";
import * as ENVIRONMENT from "./environment";
import { ModelLoader } from "./modelloader";
import { Shelf } from "./shelf";
import { new_shelf } from "./new_shelf";

class App {
    constructor() {
        const test = new new_shelf();
        test.setHeight(5.4);
        test.setNumberOfStruts(16);

        const serialized = test.serialize();
        const deserialized = new_shelf.deserialize(serialized);

        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new BABYLON.Engine(canvas, true);
        var scene = new BABYLON.Scene(engine);

        const environment = scene.createDefaultEnvironment();

        var camera: BABYLON.ArcRotateCamera = CAMERA.createCamera(scene, canvas);
        camera.attachControl(canvas, true);
        
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(-0.5, 1, 0), scene);

        const shadowGenerator = ENVIRONMENT.createEnvironment(scene);

        const modelUrls = [
            "models/strut.glb",
            "models/foot.glb",
            "models/shelf_end.glb",
            "models/shelf_middle.glb",
            "models/shelf_stretch.glb",
            "models/clamp.glb"
        ];

        const modelLoader = new ModelLoader(scene, shadowGenerator);
        // wait for all models to be loaded and create shelf afterwards
        Promise.all(modelUrls.map(url => modelLoader.preloadModel(url))).then(() => {
            const shelf = new Shelf(scene, modelLoader, new BABYLON.Vector3(0, 0, 0));
            shelf.setStruts(2.4, 0.5, 4);

            shelf.addShelf(1, 0, 2);
            shelf.addShelf(0.8, 2, 3);
        });

        document.addEventListener("shelfChange", (e) => {
            const bbox = (e as CustomEvent).detail as BABYLON.BoundingBox;

            // focus camera on bounding box center
            const center = bbox.center;

            camera.setTarget(center);
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