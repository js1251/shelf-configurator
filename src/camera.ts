import * as BABYLON from "@babylonjs/core";

export const createCamera = (scene: BABYLON.Scene, canvas: HTMLCanvasElement): BABYLON.ArcRotateCamera => {
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 6;
    camera.panningSensibility = 0;

    // limit up and down rotation to look straight ahead and only allow 10 degrees up or down
    camera.lowerBetaLimit = 60 * Math.PI / 180;
    camera.upperBetaLimit = 95 * Math.PI / 180;

    // limit left right rotation to -22.5 to 22.5 degrees
    //camera.lowerAlphaLimit = Math.PI / 4;
    //camera.upperAlphaLimit = Math.PI - Math.PI / 4;

    // set default camera rotation to 180 degrees
    camera.alpha = -Math.PI / 2;

    // adjust near and far clip planes
    camera.minZ = 0.001;

    // always zoom to mouse position
    camera.attachControl(canvas, true);
    camera.inputs.removeByType("ArcRotateCameraMouseWheelInput");
    const mouseWheelInput = new BABYLON.ArcRotateCameraMouseWheelInput();
    mouseWheelInput.wheelPrecision = 50;
    mouseWheelInput.zoomToMouseLocation = true;

    // make it so when zooming in you zoom in on the mouse position
    // but when zooming out you zoom out from the center of the screen

    mouseWheelInput.wheelDeltaPercentage = 0.01;

    camera.inputs.add(mouseWheelInput);
    return camera;
};