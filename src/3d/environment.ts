import * as BABYLON from "@babylonjs/core";
import { LiteEvent } from "../event_engine/LiteEvent";

// TODO: could be an entity

export class Environment {
    private scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.ShadowGenerator;
    private defaultMaterial: BABYLON.StandardMaterial;

    private scaleHandle: BABYLON.Mesh;

    private ground: BABYLON.Mesh;
    private ceiling: BABYLON.Mesh;
    private leftWall: BABYLON.Mesh;
    private rightWall: BABYLON.Mesh;
    private frontWall: BABYLON.Mesh;
    private backWall: BABYLON.Mesh;

    private light: BABYLON.PointLight;
    private isNight: boolean = true;

    private static FLOOR_SCALE = 0.4;

    private readonly onRoomChanged = new LiteEvent<BABYLON.BoundingBox>();
    public get RoomChanged() {
        return this.onRoomChanged.expose();
    }

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;

        this.createShadowGenerator();
        this.setBackgroundColor(BABYLON.Color4.FromHexString("#E0D9CC"));

        this.defaultMaterial = new BABYLON.StandardMaterial("defaultMaterial", this.scene);
        this.defaultMaterial.diffuseColor = BABYLON.Color3.FromHexString('#eae2dc');
        this.scene.metadata.debugOverlay.attachColorPicker('Wall Color', {initialValue: this.defaultMaterial.diffuseColor.toHexString()}, (value) => {
            this.defaultMaterial.unfreeze();
            this.defaultMaterial.diffuseColor = BABYLON.Color3.FromHexString(value);
            this.defaultMaterial.emissiveColor = this.defaultMaterial.diffuseColor;
            this.scene.onAfterRenderObservable.add(() => {this.defaultMaterial.freeze()});
        });

        this.defaultMaterial.emissiveColor = this.defaultMaterial.diffuseColor.scale(0);
        this.scene.metadata.debugOverlay.attachSlider('Wall Glow intensity', {
            initialValue: 0,
            min: 0,
            max: 1,
            step: 0.01,
        }, (value) => {
            this.defaultMaterial.unfreeze();
            this.defaultMaterial.emissiveColor = this.defaultMaterial.diffuseColor.scale(value);
            this.scene.onAfterRenderObservable.add(() => {this.defaultMaterial.freeze()});
        });
        this.defaultMaterial.specularColor = BABYLON.Color3.Black();
        this.defaultMaterial.freeze();



        this.scaleHandle = BABYLON.MeshBuilder.CreateBox("scaleHandle", { size: 1 }, this.scene);
        this.scaleHandle.isVisible = false;
        this.scaleHandle.isPickable = false;

        this.createGround();
        this.createCeiling();
        this.createWalls();

        this.setRoomDepth(1);
        this.setRoomHeight(1);
        this.setRoomWidth(1);
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
        material.unfreeze();

        const uScaleFactor = width * Environment.FLOOR_SCALE;
        const uOffsetFactor = (1 - uScaleFactor) / 2;

        const diffuseTexture = (material.baseTexture as BABYLON.Texture);
        diffuseTexture.uScale = uScaleFactor;
        diffuseTexture.uOffset = uOffsetFactor;

        const normalTexture = (material.normalTexture as BABYLON.Texture);
        normalTexture.uScale = uScaleFactor;
        normalTexture.uOffset = uOffsetFactor;

        const metallicRoughnessTexture = (material.metallicRoughnessTexture as BABYLON.Texture);
        metallicRoughnessTexture.uScale = uScaleFactor;
        metallicRoughnessTexture.uOffset = uOffsetFactor;

        this.scene.onAfterRenderObservable.add(() => {material.freeze()});

        this.onRoomChanged.trigger(this.getBoundingBox());
    }

    getRoomWidth(): number {
        return this.scaleHandle.scaling.x;
    }

    setRoomDepth(depth: number): void {
        this.scaleHandle.scaling.z = depth;
        
        const material = this.ground.material as BABYLON.PBRMetallicRoughnessMaterial;
        material.unfreeze();

        const vScaleFactor = depth * Environment.FLOOR_SCALE;
        const vOffsetFactor = (1 - vScaleFactor) / 2;

        const diffuseTexture = (material.baseTexture as BABYLON.Texture);
        diffuseTexture.vScale = vScaleFactor;
        diffuseTexture.vOffset = vOffsetFactor;

        const normalTexture = (material.normalTexture as BABYLON.Texture);
        normalTexture.vScale = vScaleFactor;
        normalTexture.vOffset = vOffsetFactor;

        const metallicRoughnessTexture = (material.metallicRoughnessTexture as BABYLON.Texture);
        metallicRoughnessTexture.vScale = vScaleFactor;
        metallicRoughnessTexture.vOffset = vOffsetFactor;
        
        this.scene.onAfterRenderObservable.add(() => {material.freeze()});

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

    setNight(isNight: boolean) {
        this.isNight = isNight;

        if (isNight) {
            this.setBackgroundColor(BABYLON.Color4.FromHexString("#0D0D0D"));
            this.light.intensity = 0;
        } else {
            this.setBackgroundColor(BABYLON.Color4.FromHexString("#E0D9CC"));
            this.light.intensity = 0.5;
        }
    }

    private createShadowGenerator() {
        this.light = new BABYLON.PointLight("roomLight", new BABYLON.Vector3(0, 0, 0), this.scene);
        this.light.diffuse = BABYLON.Color3.FromHexString("#FFFFFF");
        this.scene.metadata.debugOverlay.attachColorPicker('Light Color', {initialValue: this.light.diffuse.toHexString()}, (value) => {
            this.light.diffuse = BABYLON.Color3.FromHexString(value);
        });
        this.light.intensity = 0.2;
        this.scene.metadata.debugOverlay.attachSlider('Light Intensity', {
            initialValue: this.light.intensity,
            min: 0,
            max: 3,
            step: 0.1,
        }, (value) => {
        this.light.intensity = value;
    });
        this.light.position = new BABYLON.Vector3(0, 2.2, 0);

        const shadowGenerator = new BABYLON.ShadowGenerator(1024, this.light);
        shadowGenerator.setDarkness(0.1);
        shadowGenerator.bias = 0.000002;
        shadowGenerator.usePoissonSampling = true;

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

        pbr.baseTexture = diffuseTexture;
    
        const bumpTexture = new BABYLON.Texture(
            "textures/WoodFloor051_1K-JPG_NormalDX.jpg",
            this.scene
        ) as BABYLON.Texture;

        pbr.normalTexture = bumpTexture;

        const roughnessTexture = new BABYLON.Texture(
            "textures/WoodFloor051_1K-JPG_Roughness.jpg",
            this.scene
        ) as BABYLON.Texture;

        pbr.metallicRoughnessTexture = roughnessTexture;
        pbr.metallic = 0.05;

        pbr.freeze();

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