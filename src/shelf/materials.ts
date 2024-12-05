import * as BABYLON from "@babylonjs/core";
import { TriPlanarMaterial } from "@babylonjs/materials";

export class Resources {
    static TEXTURE_WOOD_COLOR: BABYLON.Texture;
    static TEXTURE_WOOD_NORMAL: BABYLON.Texture;
    static TEXTURE_WOOD_AOROUGHMETAL: BABYLON.Texture;

    static TEXTURE_ENDGRAIN_COLOR: BABYLON.Texture;
    static TEXTURE_ENDGRAIN_NORMAL: BABYLON.Texture;

    static TEXTURE_COATEDMETAL_COLOR: BABYLON.Texture;
    static TEXTURE_COATEDMETAL_NORMAL: BABYLON.Texture;

    static TEXTURE_BRUSHEDMETAL_COLOR: BABYLON.Texture;
    static TEXTURE_BRUSHEDMETAL_NORMAL: BABYLON.Texture;

    static OAK_OILED_MATERIAL: BABYLON.Material;
    static OAK_VARNISHED_MATERIAL: BABYLON.Material;

    constructor(scene: BABYLON.Scene) {
        Resources.TEXTURE_WOOD_COLOR = new BABYLON.Texture("textures/board_wood/color.jpg", scene);
        Resources.TEXTURE_WOOD_NORMAL = new BABYLON.Texture("textures/board_wood/normal.jpg", scene);
        Resources.TEXTURE_WOOD_AOROUGHMETAL = new BABYLON.Texture("textures/board_wood/ao_rough_metal.jpg", scene);

        Resources.TEXTURE_ENDGRAIN_COLOR = new BABYLON.Texture("textures/board_wood/endgrain_color.jpg", scene);
        Resources.TEXTURE_ENDGRAIN_NORMAL = new BABYLON.Texture("textures/board_wood/endgrain_normal.jpg", scene);

        Resources.TEXTURE_COATEDMETAL_COLOR = new BABYLON.Texture("textures/strut_coated/color.jpg", scene);
        Resources.TEXTURE_COATEDMETAL_NORMAL = new BABYLON.Texture("textures/strut_coated/normal.jpg", scene);
        Resources.TEXTURE_BRUSHEDMETAL_COLOR = new BABYLON.Texture("textures/strut_brushed/color.jpg", scene);
        Resources.TEXTURE_BRUSHEDMETAL_NORMAL = new BABYLON.Texture("textures/strut_brushed/normal.jpg", scene);

        BABYLON.NodeMaterial.ParseFromFileAsync("materials_oak_oiled", "node_materials/boardWood.json", scene).then((nodeMaterial) => {
            (nodeMaterial.getBlockByName("diffuseTextureX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_ENDGRAIN_COLOR;
            (nodeMaterial.getBlockByName("diffuseTextureY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_COLOR;
            (nodeMaterial.getBlockByName("diffuseTextureZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_COLOR;

            (nodeMaterial.getBlockByName("normalTextureX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_ENDGRAIN_NORMAL;
            (nodeMaterial.getBlockByName("normalTextureY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_NORMAL;
            (nodeMaterial.getBlockByName("normalTextureZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_NORMAL;

            (nodeMaterial.getBlockByName("ambientRoughnessMetalX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
            (nodeMaterial.getBlockByName("ambientRoughnessMetalY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
            (nodeMaterial.getBlockByName("ambientRoughnessMetalZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
            
            (nodeMaterial.getBlockByName("normalFactor") as BABYLON.InputBlock).value = 0.6;
            (nodeMaterial.getBlockByName("roughnessFactor") as BABYLON.InputBlock).value = 0.5;
            (nodeMaterial.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#eac586");
            
            Resources.OAK_OILED_MATERIAL = nodeMaterial;
        });

        BABYLON.NodeMaterial.ParseFromFileAsync("materials_oak_varnisched", "node_materials/boardWood.json", scene).then((nodeMaterial) => {
            (nodeMaterial.getBlockByName("diffuseTextureX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_ENDGRAIN_COLOR;
            (nodeMaterial.getBlockByName("diffuseTextureY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_COLOR;
            (nodeMaterial.getBlockByName("diffuseTextureZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_COLOR;

            (nodeMaterial.getBlockByName("normalTextureX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_ENDGRAIN_NORMAL;
            (nodeMaterial.getBlockByName("normalTextureY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_NORMAL;
            (nodeMaterial.getBlockByName("normalTextureZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_NORMAL;

            (nodeMaterial.getBlockByName("ambientRoughnessMetalX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
            (nodeMaterial.getBlockByName("ambientRoughnessMetalY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
            (nodeMaterial.getBlockByName("ambientRoughnessMetalZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
            
            (nodeMaterial.getBlockByName("normalFactor") as BABYLON.InputBlock).value = 0.15;
            (nodeMaterial.getBlockByName("roughnessFactor") as BABYLON.InputBlock).value = 0.38;
            (nodeMaterial.getBlockByName("metallicFactor") as BABYLON.InputBlock).value = 0.3;
            (nodeMaterial.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#eac086");
            
            Resources.OAK_VARNISHED_MATERIAL = nodeMaterial;
        });
    }
}

export abstract class ShelfMaterial {
    private _material: BABYLON.Material;
    
    

    get material(): BABYLON.Material {
        if (!this._material) {
            this._material = this.createMaterial();
        }
        
        return this._material;
    }

    protected abstract createMaterial(): BABYLON.Material;

    abstract get name(): string;

    abstract get finish(): string;

    abstract get previewImageUrl(): string;
}

class EicheGeoelt extends ShelfMaterial {
    protected createMaterial(): BABYLON.Material {
        return Resources.OAK_OILED_MATERIAL;
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

class EicheKlarlack extends ShelfMaterial {
    protected createMaterial(): BABYLON.Material {
        return Resources.OAK_VARNISHED_MATERIAL;
    }

    get name(): string {
        return 'Eiche';
    }

    get finish(): string {
        return 'Klarlack';
    }

    get previewImageUrl(): string {
        return 'images/oak_bare.jpg';
    }
}

class BucheGeoelt extends ShelfMaterial {
    protected createMaterial(): BABYLON.Material {
        const material = new TriPlanarMaterial("materials_beech_oiled");
        material.diffuseTextureY = Resources.TEXTURE_WOOD_COLOR;
        material.diffuseTextureX = Resources.TEXTURE_ENDGRAIN_COLOR;
        material.diffuseTextureZ = Resources.TEXTURE_WOOD_COLOR;
        material.normalTextureY = Resources.TEXTURE_WOOD_NORMAL;
        material.normalTextureX = Resources.TEXTURE_ENDGRAIN_NORMAL;
        material.normalTextureZ = Resources.TEXTURE_WOOD_NORMAL;
        material.diffuseColor = BABYLON.Color3.FromHexString("#f2b08c");
        material.tileSize = 0.5;
        material.freeze();

        material.getScene().metadata.debugOverlay.attachColorPicker('Beech Color', {initialValue: material.diffuseColor.toHexString()}, (value) => {
            material.diffuseColor = BABYLON.Color3.FromHexString(value);
        });
        
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
    protected createMaterial(): BABYLON.Material {
        const material = new TriPlanarMaterial("materials_ash_oiled");
        material.diffuseTextureY = Resources.TEXTURE_WOOD_COLOR;
        material.diffuseTextureX = Resources.TEXTURE_ENDGRAIN_COLOR;
        material.diffuseTextureZ = Resources.TEXTURE_WOOD_COLOR;
        material.normalTextureY = Resources.TEXTURE_WOOD_NORMAL;
        material.normalTextureX = Resources.TEXTURE_ENDGRAIN_NORMAL;
        material.normalTextureZ = Resources.TEXTURE_WOOD_NORMAL;
        material.diffuseColor = BABYLON.Color3.FromHexString("#f5e8cc");
        material.tileSize = 0.5;
        material.freeze();

        material.getScene().metadata.debugOverlay.attachColorPicker('Ash Color', {initialValue: material.diffuseColor.toHexString()}, (value) => {
            material.diffuseColor = BABYLON.Color3.FromHexString(value);
        });
        
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
    protected createMaterial(): BABYLON.Material {
        const material = new TriPlanarMaterial("materials_wallnut_oiled");
        material.diffuseTextureY = Resources.TEXTURE_WOOD_COLOR;
        material.diffuseTextureX = Resources.TEXTURE_ENDGRAIN_COLOR;
        material.diffuseTextureZ = Resources.TEXTURE_WOOD_COLOR;
        material.normalTextureY = Resources.TEXTURE_WOOD_NORMAL;
        material.normalTextureX = Resources.TEXTURE_ENDGRAIN_NORMAL;
        material.normalTextureZ = Resources.TEXTURE_WOOD_NORMAL;
        material.diffuseColor = BABYLON.Color3.FromHexString("#734e2b");
        material.tileSize = 0.5;
        material.freeze();

        material.getScene().metadata.debugOverlay.attachColorPicker('Wallnut Color', {initialValue: material.diffuseColor.toHexString()}, (value) => {
            material.diffuseColor = BABYLON.Color3.FromHexString(value);
        });
        
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
    protected createMaterial(): BABYLON.Material {
        const material = new TriPlanarMaterial("materials_coated_black");
        material.diffuseTextureX = Resources.TEXTURE_COATEDMETAL_COLOR;
        material.diffuseTextureZ = material.diffuseTextureX;
        material.normalTextureX = Resources.TEXTURE_COATEDMETAL_NORMAL;
        material.normalTextureZ = material.normalTextureX;
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
    protected createMaterial(): BABYLON.Material {
        const material = new TriPlanarMaterial("materials_stainless_brushed");
        material.diffuseTextureX = Resources.TEXTURE_BRUSHEDMETAL_COLOR;
        material.diffuseTextureZ = material.diffuseTextureX;
        material.normalTextureX = Resources.TEXTURE_BRUSHEDMETAL_NORMAL;
        material.normalTextureZ = material.normalTextureX;
        material.diffuseColor = BABYLON.Color3.FromHexString("#d9d9d9");
        material.tileSize = 0.5;
        material.freeze();

        material.getScene().metadata.debugOverlay.attachColorPicker('Stainless Color', {initialValue: material.diffuseColor.toHexString()}, (value) => {
            material.diffuseColor = BABYLON.Color3.FromHexString(value);
        });
        
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
    protected createMaterial(): BABYLON.Material {
        const material = new TriPlanarMaterial("materials_brass_brushed");
        material.diffuseTextureX = Resources.TEXTURE_BRUSHEDMETAL_COLOR;
        material.diffuseTextureZ = material.diffuseTextureX;
        material.normalTextureX = Resources.TEXTURE_BRUSHEDMETAL_NORMAL;
        material.normalTextureZ = material.normalTextureX;
        material.diffuseColor = BABYLON.Color3.FromHexString("#ffef42");
        material.tileSize = 0.5;
        material.freeze();

        material.getScene().metadata.debugOverlay.attachColorPicker('Brass Color', {initialValue: material.diffuseColor.toHexString()}, (value) => {
            material.diffuseColor = BABYLON.Color3.FromHexString(value);
        });
        
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
    new EicheKlarlack(),
    //new EscheGeoelt(),
    //new NussbaumGeoelt(),
];

export const METAL_MATERIALS : ShelfMaterial[] = [
    new PulverbeschichtetSchwarz(),
    new EdelstahlGebuerstet(),
    new MessingGebuerstet(),
];