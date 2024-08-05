import * as BABYLON from "@babylonjs/core";

export const createEnvironment = (scene: BABYLON.Scene): BABYLON.ShadowGenerator => {
    scene.createDefaultEnvironment();
    
    var light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(3, -3, 0), scene);

    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.bias = 0.001;
    shadowGenerator.normalBias = 0.02;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 10;
    shadowGenerator.useKernelBlur = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.setDarkness(0.5);

    return shadowGenerator;
};