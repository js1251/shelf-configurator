import * as BABYLON from "@babylonjs/core";

export abstract class ShelfMaterial {    
    abstract get material(): BABYLON.StandardMaterial;

    abstract get name(): string;

    abstract get finish(): string;

    abstract get previewImageUrl(): string;

    abstract get solidColorHex(): string;
}

class TestShelfMaterial extends ShelfMaterial {
    get material(): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial('testWood');
        
        material.diffuseTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Color.jpg");
        material.bumpTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_NormalDX.jpg");
        material.specularTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Roughness.jpg");

        return material;
    }

    get name(): string {
        return 'Test wood';
    }

    get finish(): string {
        return 'Test finish';
    }

    get previewImageUrl(): string {
        return 'textures/WoodFloor051_1K-JPG_Color.jpg';
    }

    get solidColorHex(): string {
        return '#ff4400';
    }
}

export const WOOD_MATERIALS : ShelfMaterial[] = [
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
];

export const METAL_MATERIALS : ShelfMaterial[] = [
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
    new TestShelfMaterial(),
];