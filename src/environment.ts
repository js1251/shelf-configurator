import * as BABYLON from "@babylonjs/core";
import { LiteEvent } from "./event_engine/LiteEvent";

export class Environment {
    private scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.ShadowGenerator;
    private defaultMaterial: BABYLON.PBRMetallicRoughnessMaterial;

    private scaleHandle: BABYLON.Mesh;

    private ground: BABYLON.Mesh;
    private ceiling: BABYLON.Mesh;
    private leftWall: BABYLON.Mesh;
    private rightWall: BABYLON.Mesh;
    private frontWall: BABYLON.Mesh;
    private backWall: BABYLON.Mesh;

    private light: BABYLON.PointLight;

    private readonly onRoomChanged = new LiteEvent<BABYLON.BoundingBox>();
    public get RoomChanged() {
        return this.onRoomChanged.expose();
    }

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;

        this.createShadowGenerator();
        this.setBackgroundColor(new BABYLON.Color4(1, 1, 1, 1));

        this.defaultMaterial = new BABYLON.PBRMetallicRoughnessMaterial("defaultMaterial", this.scene);
        this.defaultMaterial.baseColor = BABYLON.Color3.White();
        this.defaultMaterial.metallic = 0.1;
        this.defaultMaterial.roughness = 0.6;
        this.defaultMaterial.alpha = 1;

        this.scaleHandle = BABYLON.MeshBuilder.CreateBox("scaleHandle", { size: 1 }, this.scene);
        this.scaleHandle.isVisible = false;
        this.scaleHandle.isPickable = false;

        this.createGround();
        this.createCeiling();
        this.createWalls();
    }

    getShadowGenerator(): BABYLON.ShadowGenerator {
        return this.shadowGenerator;
    }

    setBackgroundColor(color: BABYLON.Color4): void {
        this.scene.clearColor = color;
    }

    setRoomHeight(height: number): void {
        this.scaleHandle.scaling.y = height;
        this.scaleHandle.position.y = height * 0.5;

        this.light.position.y = height - 0.3;
        
        this.onRoomChanged.trigger(this.getBoundingBox());
    }

    getRoomHeight(): number {
        return this.scaleHandle.scaling.y;
    }

    setRoomWidth(width: number): void {
        this.scaleHandle.scaling.x = width;

        const material = this.ground.material as BABYLON.PBRMetallicRoughnessMaterial;

        (material.baseTexture as BABYLON.Texture).uScale = width * 0.5;
        (material.normalTexture as BABYLON.Texture).uScale = width * 0.5;
        (material.metallicRoughnessTexture as BABYLON.Texture).uScale = width * 0.5;

        this.onRoomChanged.trigger(this.getBoundingBox());
    }

    getRoomWidth(): number {
        return this.scaleHandle.scaling.x;
    }

    setRoomDepth(depth: number): void {
        this.scaleHandle.scaling.z = depth;
        
        const material = this.ground.material as BABYLON.PBRMetallicRoughnessMaterial;

        (material.baseTexture as BABYLON.Texture).vScale = depth * 0.5;
        (material.normalTexture as BABYLON.Texture).vScale = depth * 0.5;
        (material.metallicRoughnessTexture as BABYLON.Texture).vScale = depth * 0.5;

        this.onRoomChanged.trigger(this.getBoundingBox());
    }

    getRoomDepth(): number {
        return this.scaleHandle.scaling.z;
    }

    getBoundingBox(): BABYLON.BoundingBox {
        const halfWidth = this.getRoomWidth() * 0.5;
        const halfDepth = this.getRoomDepth() * 0.5;

        const min = new BABYLON.Vector3(-halfWidth, 0, -halfDepth);
        const max = new BABYLON.Vector3(halfWidth, this.getRoomHeight(), halfDepth);

        return new BABYLON.BoundingBox(min, max);
    }

    private createShadowGenerator() {
        this.light = new BABYLON.PointLight("light", new BABYLON.Vector3(0.1, 0, 0), this.scene);
        this.light.intensity = 1;

        const shadowGenerator = new BABYLON.ShadowGenerator(1024, this.light);
        shadowGenerator.setDarkness(0.7);
        shadowGenerator.bias = 0.000002;

        this.shadowGenerator = shadowGenerator;
    }

    private createGround() {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 1, height: 1 }, this.scene);
        this.ground.receiveShadows = true;
        this.ground.isPickable = false;

        const pbr = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.scene);
        const diffuseTexture = new BABYLON.Texture(
            "textures/WoodFloor051_1K-JPG_Color.jpg",
            this.scene
        ) as BABYLON.Texture;

        diffuseTexture.uScale = 0.5;
        diffuseTexture.vScale = 0.5;
        pbr.baseTexture = diffuseTexture;
    
        const bumpTexture = new BABYLON.Texture(
            "textures/WoodFloor051_1K-JPG_NormalDX.jpg",
            this.scene
        ) as BABYLON.Texture;

        bumpTexture.uScale = 0.5;
        bumpTexture.vScale = 0.5;
        pbr.normalTexture = bumpTexture;

        const roughnessTexture = new BABYLON.Texture(
            "textures/WoodFloor051_1K-JPG_Roughness.jpg",
            this.scene
        ) as BABYLON.Texture;

        roughnessTexture.uScale = 0.5;
        roughnessTexture.vScale = 0.5;
        pbr.metallicRoughnessTexture = roughnessTexture;

        this.ground.material = pbr;

        this.ground.position.y = -0.5;
        this.ground.setParent(this.scaleHandle);
    }

    private createCeiling() {
        this.ceiling = BABYLON.MeshBuilder.CreateGround("ceiling", { width: 1, height: 1 }, this.scene);
        this.ceiling.material = this.defaultMaterial;
        this.ceiling.rotation.x = Math.PI
        this.ceiling.receiveShadows = true;
        this.ceiling.isPickable = false;

        this.ceiling.position.y = 0.5;
        this.ceiling.setParent(this.scaleHandle);
    }

    private createWalls() {
        this.leftWall = BABYLON.MeshBuilder.CreateGround("leftWall", { width: 1, height: 1 }, this.scene);
        this.leftWall.material = this.defaultMaterial;
        this.leftWall.rotation.z = Math.PI / 2;
        this.leftWall.rotation.y = Math.PI;
        this.leftWall.position.x = -0.5;
        this.leftWall.receiveShadows = true;
        this.leftWall.isPickable = false;
        this.leftWall.setParent(this.scaleHandle);

        this.rightWall = BABYLON.MeshBuilder.CreateGround("rightWall", { width: 1, height: 1 }, this.scene);
        this.rightWall.material = this.defaultMaterial;
        this.rightWall.rotation.z = Math.PI / 2;
        this.rightWall.position.x = 0.5;
        this.rightWall.receiveShadows = true;
        this.rightWall.isPickable = false;
        this.rightWall.setParent(this.scaleHandle);

        this.frontWall = BABYLON.MeshBuilder.CreateGround("frontWall", { width: 1, height: 1 }, this.scene);
        this.frontWall.material = this.defaultMaterial;
        this.frontWall.rotation.z = Math.PI / 2;
        this.frontWall.rotation.y = Math.PI / 2;
        this.frontWall.position.z = -0.5;
        this.frontWall.receiveShadows = true;
        this.frontWall.isPickable = false;
        this.frontWall.setParent(this.scaleHandle);

        this.backWall = BABYLON.MeshBuilder.CreateGround("backWall", { width: 1, height: 1 }, this.scene);
        this.backWall.material = this.defaultMaterial;
        this.backWall.rotation.z = Math.PI / 2;
        this.backWall.rotation.y = -Math.PI / 2;
        this.backWall.position.z = 0.5;
        this.backWall.receiveShadows = true;
        this.backWall.isPickable = false;
        this.backWall.setParent(this.scaleHandle);
    }
}