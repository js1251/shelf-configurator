import * as BABYLON from "@babylonjs/core";
import { LiteEvent } from "../event_engine/LiteEvent";

export abstract class Environment {
    protected scene: BABYLON.Scene;

    protected readonly onRoomChanged = new LiteEvent<BABYLON.BoundingBox>();
    public get RoomChanged() {
        return this.onRoomChanged.expose();
    }

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;

        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://assets.babylonjs.com/textures/environment.env", scene);
        scene.environmentTexture = hdrTexture;
        scene.environmentIntensity = 0.3;

        this.createShadowGenerator();
        this.setBackgroundColor(BABYLON.Color4.FromHexString("#E0D9CC"));
    }

    setBackgroundColor(color: BABYLON.Color4): void {
        this.scene.clearColor = color;
    }
    
    abstract getShadowGenerator(): BABYLON.ShadowGenerator;

    abstract setRoomHeight(height: number): void;

    abstract getRoomHeight(): number;

    abstract setRoomWidth(width: number): void;

    abstract getRoomWidth(): number;

    abstract setRoomDepth(depth: number): void;

    abstract getRoomDepth(): number;

    abstract getBoundingBox(): BABYLON.BoundingBox;
    
    abstract setNight();
    
    abstract setDay();

    protected abstract createShadowGenerator();
}