import * as BABYLON from "@babylonjs/core";

export const createCamera = (scene: BABYLON.Scene, canvas: HTMLCanvasElement): BABYLON.ArcRotateCamera => {
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    
    camera.wheelPrecision = 50;
    //camera.lowerRadiusLimit = 2;
    //camera.upperRadiusLimit = 4;
    camera.panningSensibility = 0;

    // limit up and down rotation to look straight ahead and only allow 10 degrees up or down
    camera.lowerBetaLimit = 60 * Math.PI / 180;
    camera.upperBetaLimit = 90 * Math.PI / 180;

    // adjust near and far clip planes
    camera.minZ = 0.001;

    // always zoom to mouse position
    camera.attachControl(canvas, true);
    camera.inputs.removeByType("ArcRotateCameraMouseWheelInput");

    const mouseWheelInput = new BABYLON.ArcRotateCameraMouseWheelInput();
    mouseWheelInput.wheelPrecision = 50;
    mouseWheelInput.zoomToMouseLocation = true;
    mouseWheelInput.wheelDeltaPercentage = 0.01;

    camera.inputs.add(mouseWheelInput);
    return camera;
};