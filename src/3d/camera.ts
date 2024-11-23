import * as BABYLON from "@babylonjs/core";

export class ShelfCamera {
    camera: BABYLON.ArcRotateCamera;
    private desiredTarget: BABYLON.Vector3;

    setDesiredTarget(target: BABYLON.Vector3) {
        this.desiredTarget = target;
    }
    
    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, desiredTarget: BABYLON.Vector3 = BABYLON.Vector3.Zero()) {
        this.desiredTarget = desiredTarget;
        
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, 0, 0), scene);
        camera.attachControl(canvas, true);
        
        camera.wheelPrecision = 50;
        camera.lowerRadiusLimit = 0.5;
        camera.upperRadiusLimit = 4;
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

        scene.onPointerObservable.add((event) => {
            if (event.type !== BABYLON.PointerEventTypes.POINTERWHEEL) {
                return;
            }

            const wheelEvent = event.event as WheelEvent;

            if (wheelEvent.deltaY <= 0) {
                mouseWheelInput.zoomToMouseLocation = true;
                return;
            }

            const progress = (camera.radius - camera.lowerRadiusLimit) / (camera.upperRadiusLimit - camera.lowerRadiusLimit);

            mouseWheelInput.zoomToMouseLocation = false;
            camera.setTarget(BABYLON.Vector3.Lerp(camera.target, this.desiredTarget, progress * 0.1));
        });

        this.camera = camera;
    }
}