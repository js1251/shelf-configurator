import * as BABYLON from "@babylonjs/core";
import { Environment } from "./environment";

export class EnvironmentVoid extends Environment {
    private shadowGenerator: BABYLON.ShadowGenerator;
    private sun: BABYLON.DirectionalLight;

    private roomHeight: number;
    private roomWidth: number;
    private roomDepth: number;

    private ground: BABYLON.Mesh;

    private static groundPadding = 1;

    constructor(scene: BABYLON.Scene) {
        super(scene);

        this.createGround();
        this.setRoomHeight(1);
    }
    
    getShadowGenerator(): BABYLON.ShadowGenerator {
        return this.shadowGenerator;
    }

    // TODO: something is broken here when adding new stuts. Only updates correctly once a board is moved to new strut.
    setCenter(center: BABYLON.Vector3): void {
        this.ground.position.x = center.x;
        this.ground.position.z = center.z;
    }

    setRoomHeight(height: number): void {
        this.roomHeight = height;
    }

    getRoomHeight(): number {
        return this.roomHeight;
    }

    setRoomWidth(width: number): void {
        this.roomWidth = width;
        this.recalculateGroundSize();
    }

    getRoomWidth(): number {
        return this.roomWidth;
    }

    setRoomDepth(depth: number): void {
        this.roomDepth = depth;
        this.recalculateGroundSize();
    }

    getRoomDepth(): number {
        return this.roomDepth;
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

        this.setBackgroundColor(BABYLON.Color4.FromHexString('var(--background-l-1)'));
        this.scene.environmentIntensity = 0.3;
    }
    
    protected createShadowGenerator() {        
        this.sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(3, -3, 2), this.scene);
        //this.sun.diffuse = BABYLON.Color3.FromHexString("#f5e5d6");
        //this.sun.intensity = 0.2;

        const shadowGenerator = new BABYLON.ShadowGenerator(1024, this.sun);
        shadowGenerator.setDarkness(0.4);
        shadowGenerator.bias = 0.000002;
        shadowGenerator.usePoissonSampling = true;

        this.shadowGenerator = shadowGenerator;
    }

    private createGround() {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 1, height: 1 }, this.scene);
        this.ground.receiveShadows = true;
        this.ground.isPickable = false;

        const material = new BABYLON.StandardMaterial("environment_ground", this.scene);
        material.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/backgroundGround.png", this.scene)
        material.diffuseTexture.gammaSpace = false
        material.diffuseTexture.hasAlpha = true
        material.useAlphaFromDiffuseTexture = true;
        material.diffuseColor = BABYLON.Color3.FromHexString('#E0D9CC'); // TODO: grab from colors.css
        material.specularColor = BABYLON.Color3.FromHexString('#333333');

        // material.freeze();

        this.ground.material = material;
    }

    private recalculateGroundSize() {
        const width = this.roomWidth + EnvironmentVoid.groundPadding * 2;
        const depth = this.roomDepth + EnvironmentVoid.groundPadding * 2;

        this.ground.scaling.x = Math.max(width, depth);
        this.ground.scaling.z = this.ground.scaling.x;
    }
}