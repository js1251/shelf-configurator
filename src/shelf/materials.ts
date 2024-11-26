import * as BABYLON from "@babylonjs/core";

export abstract class ShelfMaterial {
    private _material: BABYLON.StandardMaterial;

    get material(): BABYLON.StandardMaterial {
        if (!this._material) {
            this._material = this.createMaterial();
        }
        
        return this._material;
    }

    protected abstract createMaterial(): BABYLON.StandardMaterial;

    abstract get name(): string;

    abstract get finish(): string;

    abstract get previewImageUrl(): string;
}

class EicheGeoelt extends ShelfMaterial {
    protected createMaterial(): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial('oak_oiled');
        
        material.diffuseTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Color.jpg");
        material.bumpTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_NormalDX.jpg");
        material.specularTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Roughness.jpg");
        material.freeze();
        
        return material;
    }

    get name(): string {
        return 'Eiche';
    }

    get finish(): string {
        return 'Geölt';
    }

    get previewImageUrl(): string {
        return 'images/oak_bare.jpg';
    }
}

class BucheGeoelt extends ShelfMaterial {
    protected createMaterial(): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial('beech_oiled');
        
        material.diffuseTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Color.jpg");
        material.bumpTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_NormalDX.jpg");
        material.specularTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Roughness.jpg");
        material.freeze();
        
        return material;
    }

    get name(): string {
        return 'Buche';
    }

    get finish(): string {
        return 'Geölt';
    }

    get previewImageUrl(): string {
        return 'images/beech_bare.jpg';
    }
}

class EscheGeoelt extends ShelfMaterial {
    protected createMaterial(): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial('ash_oiled');
        
        material.diffuseTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Color.jpg");
        material.bumpTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_NormalDX.jpg");
        material.specularTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Roughness.jpg");
        material.freeze();
        
        return material;
    }

    get name(): string {
        return 'Esche';
    }

    get finish(): string {
        return 'Geölt';
    }

    get previewImageUrl(): string {
        return 'images/ash_bare.jpg';
    }
}

class NussbaumGeoelt extends ShelfMaterial {
    protected createMaterial(): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial('chestnut_oiled');
        
        material.diffuseTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Color.jpg");
        material.bumpTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_NormalDX.jpg");
        material.specularTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Roughness.jpg");
        material.freeze();
        
        return material;
    }

    get name(): string {
        return 'Nussbaum';
    }

    get finish(): string {
        return 'Geölt';
    }

    get previewImageUrl(): string {
        return 'images/chestnut_bare.jpg';
    }
}

class PulverbeschichtetSchwarz extends ShelfMaterial {
    protected createMaterial(): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial('caoted_black');
        
        material.diffuseTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Color.jpg");
        material.bumpTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_NormalDX.jpg");
        material.specularTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Roughness.jpg");
        material.freeze();
        
        return material;
    }

    get name(): string {
        return 'Schwarz';
    }

    get finish(): string {
        return 'Pulverbeschichtet';
    }

    get previewImageUrl(): string {
        return 'images/coated_black.jpg';
    }
}

class EdelstahlGebuerstet extends ShelfMaterial {
    protected createMaterial(): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial('stainless_brushed');
        
        material.diffuseTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Color.jpg");
        material.bumpTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_NormalDX.jpg");
        material.specularTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Roughness.jpg");
        material.freeze();
        
        return material;
    }

    get name(): string {
        return 'Edelstahl';
    }

    get finish(): string {
        return 'Gebürstet';
    }

    get previewImageUrl(): string {
        return 'images/stainless_brushed.jpg';
    }
}

class MessingGebuerstet extends ShelfMaterial {
    protected createMaterial(): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial('brass_brushed');
        
        material.diffuseTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Color.jpg");
        material.bumpTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_NormalDX.jpg");
        material.specularTexture = new BABYLON.Texture("textures/WoodFloor051_1K-JPG_Roughness.jpg");
        material.freeze();
        
        return material;
    }

    get name(): string {
        return 'Messing';
    }

    get finish(): string {
        return 'Gebürstet';
    }

    get previewImageUrl(): string {
        return 'images/brass_brushed.jpg';
    }
}

export const WOOD_MATERIALS : ShelfMaterial[] = [
    new EicheGeoelt(),
    new BucheGeoelt(),
    new EscheGeoelt(),
    new NussbaumGeoelt(),
];

export const METAL_MATERIALS : ShelfMaterial[] = [
    new PulverbeschichtetSchwarz(),
    new EdelstahlGebuerstet(),
    new MessingGebuerstet(),
];