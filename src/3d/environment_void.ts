import * as BABYLON from "@babylonjs/core";
import { Environment } from "./environment";

export class EnvironmentVoid extends Environment {
    private shadowGenerator: BABYLON.ShadowGenerator;
    private sun: BABYLON.DirectionalLight;

    private roomHeight: number;
    private ground: BABYLON.Mesh;

    constructor(scene: BABYLON.Scene) {
        super(scene);

        this.createGround();

        this.setRoomHeight(1);
    }
    
    getShadowGenerator(): BABYLON.ShadowGenerator {
        return this.shadowGenerator;
    }

    setRoomHeight(height: number): void {
        this.roomHeight = height;        
        this.onRoomChanged.trigger(this.getBoundingBox());
    }

    getRoomHeight(): number {
        return this.roomHeight;
    }

    setRoomWidth(width: number): void {
        return;
    }

    getRoomWidth(): number {
        return Number.MAX_VALUE;
    }

    setRoomDepth(depth: number): void {
        return;
    }

    getRoomDepth(): number {
        return Number.MAX_VALUE;
    }

    getBoundingBox(): BABYLON.BoundingBox {
        const min = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        const max = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        return new BABYLON.BoundingBox(min, max);
    }

    setNight() {
        //this.sun.intensity = 0;

        this.setBackgroundColor(BABYLON.Color4.FromHexString("#0D0D0D"));
        this.scene.environmentIntensity = 0;
    }

    setDay() {
        //this.sun.intensity = 0.2;

        this.setBackgroundColor(BABYLON.Color4.FromHexString("#E0D9CC"));
        this.scene.environmentIntensity = 0.3;
    }
    
    protected createShadowGenerator() {        
        this.sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(3, -3, 0), this.scene);
        //this.sun.diffuse = BABYLON.Color3.FromHexString("#f5e5d6");
        //this.sun.intensity = 0.2;

        const shadowGenerator = new BABYLON.ShadowGenerator(1024, this.sun);
        shadowGenerator.setDarkness(0.5);
        shadowGenerator.bias = 0.000002;
        shadowGenerator.usePoissonSampling = true;

        this.shadowGenerator = shadowGenerator;
    }

    private createGround() {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, this.scene);
        this.ground.receiveShadows = true;
        this.ground.isPickable = false;

        const material = new BABYLON.StandardMaterial("environment_ground", this.scene);
        const groundTexture = "https://assets.babylonjs.com/environments/backgroundGround.png"
        material.diffuseTexture = new BABYLON.Texture(groundTexture, this.scene)
        material.diffuseTexture.gammaSpace = false
        material.diffuseTexture.hasAlpha = true
        material.useAlphaFromDiffuseTexture = true;

        material.freeze();

        this.ground.material = material;
    }
}