import * as BABYLON from "@babylonjs/core";

export const createCamera = (scene: BABYLON.Scene, canvas: HTMLCanvasElement): BABYLON.Camera => {
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 20;
    camera.panningSensibility = 0;

    // limit up and down rotation to look straight ahead and only allow 10 degrees up or down
    camera.lowerBetaLimit = Math.PI / 3;
    camera.upperBetaLimit = Math.PI / 2.2;

    // limit left right rotation to -22.5 to 22.5 degrees
    camera.lowerAlphaLimit = Math.PI / 4;
    camera.upperAlphaLimit = Math.PI - Math.PI / 4;

    return camera;
};