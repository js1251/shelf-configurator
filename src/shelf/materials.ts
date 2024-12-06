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
    static TEXTURE_BRUSHEDMETAL_AOROUGHMETAL: BABYLON.Texture;

    static OAK_OILED_MATERIAL: BABYLON.Material;
    static OAK_VARNISHED_MATERIAL: BABYLON.Material;
    static BEECH_OILED_MATERIAL: BABYLON.Material;
    static BEECH_VARNISHED_MATERIAL: BABYLON.Material;
    static ASH_OILED_MATERIAL: BABYLON.Material;
    static ASH_VARNISHED_MATERIAL: BABYLON.Material;
    static WALLNUT_OILED_MATERIAL: BABYLON.Material;
    static WALLNUT_VARNISHED_MATERIAL: BABYLON.Material;

    static STAINLESS_BRUSHED_MATERIAL: BABYLON.Material;
    static BRASS_BRUSHED_MATERIAL: BABYLON.Material;

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
        Resources.TEXTURE_BRUSHEDMETAL_AOROUGHMETAL = new BABYLON.Texture("textures/strut_brushed/ao_rough_metal.jpg", scene);

        BABYLON.NodeMaterial.ParseFromFileAsync("materials_wood_base", "node_materials/boardWood.json", scene).then((nodeMaterial) => {
            const setWoodTexture = (material: BABYLON.NodeMaterial) => {
                material.getAllTextureBlocks().forEach((block) => {
                    if (block.texture) {
                        block.texture.dispose();
                    }
                });

                (material.getBlockByName("diffuseTextureX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_ENDGRAIN_COLOR;
                (material.getBlockByName("diffuseTextureY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_COLOR;
                (material.getBlockByName("diffuseTextureZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_COLOR;

                (material.getBlockByName("normalTextureX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_ENDGRAIN_NORMAL;
                (material.getBlockByName("normalTextureY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_NORMAL;
                (material.getBlockByName("normalTextureZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_NORMAL;

                (material.getBlockByName("ambientRoughnessMetalX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
                (material.getBlockByName("ambientRoughnessMetalY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
                (material.getBlockByName("ambientRoughnessMetalZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_WOOD_AOROUGHMETAL;
            };

            const setMetalTexture = (material: BABYLON.NodeMaterial) => {
                material.getAllTextureBlocks().forEach((block) => {
                    if (block.texture) {
                        block.texture.dispose();
                    }
                });

                (material.getBlockByName("diffuseTextureX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_COLOR;
                (material.getBlockByName("diffuseTextureY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_COLOR;
                (material.getBlockByName("diffuseTextureZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_COLOR;

                (material.getBlockByName("normalTextureX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_NORMAL;
                (material.getBlockByName("normalTextureY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_NORMAL;
                (material.getBlockByName("normalTextureZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_NORMAL;

                (material.getBlockByName("ambientRoughnessMetalX") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_AOROUGHMETAL;
                (material.getBlockByName("ambientRoughnessMetalY") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_AOROUGHMETAL;
                (material.getBlockByName("ambientRoughnessMetalZ") as BABYLON.ImageSourceBlock).texture = Resources.TEXTURE_BRUSHEDMETAL_AOROUGHMETAL;
            };

            setWoodTexture(nodeMaterial);

            const oakOiled = nodeMaterial.clone("materials_oak_oiled");
            setWoodTexture(oakOiled);
            (oakOiled.getBlockByName("normalFactor") as BABYLON.InputBlock).value = 0.6;
            (oakOiled.getBlockByName("roughnessFactor") as BABYLON.InputBlock).value = 0.5;
            (oakOiled.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#eac586");
            Resources.OAK_OILED_MATERIAL = oakOiled;
            
            const oakVarnished = nodeMaterial.clone("materials_oak_varnisched");
            setWoodTexture(oakVarnished);
            (oakVarnished.getBlockByName("normalFactor") as BABYLON.InputBlock).value = 0.15;
            (oakVarnished.getBlockByName("roughnessFactor") as BABYLON.InputBlock).value = 0.38;
            (oakVarnished.getBlockByName("metallicFactor") as BABYLON.InputBlock).value = 0.3;
            (oakVarnished.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#eac086");
            Resources.OAK_VARNISHED_MATERIAL = oakVarnished;

            const beechOiled = oakOiled.clone("materials_beech_oiled");
            setWoodTexture(beechOiled);
            (beechOiled.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#ffb777");
            Resources.BEECH_OILED_MATERIAL = beechOiled;

            const beechVarnished = oakVarnished.clone("materials_beech_varnished");
            setWoodTexture(beechVarnished);
            (beechVarnished.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#f0b077");
            Resources.BEECH_VARNISHED_MATERIAL = beechVarnished;

            const ashOiled = oakOiled.clone("materials_ash_oiled");
            setWoodTexture(ashOiled);
            (ashOiled.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#ffe4a8");
            Resources.ASH_OILED_MATERIAL = ashOiled;

            const ashVarnished = oakVarnished.clone("materials_ash_varnished");
            setWoodTexture(ashVarnished);
            (ashVarnished.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#ffdda8");
            Resources.ASH_VARNISHED_MATERIAL = ashVarnished;

            const wallnutOiled = oakOiled.clone("materials_wallnut_oiled");
            setWoodTexture(wallnutOiled);
            (wallnutOiled.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#885925");
            Resources.WALLNUT_OILED_MATERIAL = wallnutOiled;

            const wallnutVarnished = oakVarnished.clone("materials_wallnut_varnished");
            setWoodTexture(wallnutVarnished);
            (wallnutVarnished.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#774e21");
            Resources.WALLNUT_VARNISHED_MATERIAL = wallnutVarnished;

            const stainlessBrushed = nodeMaterial.clone("materials_stainless_brushed");
            setMetalTexture(stainlessBrushed);
            (stainlessBrushed.getBlockByName("tileSize") as BABYLON.InputBlock).value = BABYLON.Vector3.One().scale(0.5);
            (stainlessBrushed.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#b4b9c2");
            (stainlessBrushed.getBlockByName("roughnessFactor") as BABYLON.InputBlock).value = 1;
            (stainlessBrushed.getBlockByName("metallicFactor") as BABYLON.InputBlock).value = 1;
            Resources.STAINLESS_BRUSHED_MATERIAL = stainlessBrushed;

            const brassBrushed = stainlessBrushed.clone("materials_brass_brushed");
            setMetalTexture(brassBrushed);
            (brassBrushed.getBlockByName("diffuseColor") as BABYLON.InputBlock).value = BABYLON.Color3.FromHexString("#e4b95d");
            (stainlessBrushed.getBlockByName("roughnessFactor") as BABYLON.InputBlock).value = 0.8;
            (stainlessBrushed.getBlockByName("metallicFactor") as BABYLON.InputBlock).value = 0.7;
            Resources.BRASS_BRUSHED_MATERIAL = brassBrushed;

            nodeMaterial.dispose();
            Resources.OAK_OILED_MATERIAL.freeze();
            Resources.OAK_VARNISHED_MATERIAL.freeze();
            Resources.BEECH_OILED_MATERIAL.freeze();
            Resources.BEECH_VARNISHED_MATERIAL.freeze();
            Resources.ASH_OILED_MATERIAL.freeze();
            Resources.ASH_VARNISHED_MATERIAL.freeze();
            Resources.WALLNUT_OILED_MATERIAL.freeze();
            Resources.WALLNUT_VARNISHED_MATERIAL.freeze();
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
        return Resources.BEECH_OILED_MATERIAL;
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

class BucheKlarlack extends ShelfMaterial {
    protected createMaterial(): BABYLON.Material {
        return Resources.BEECH_VARNISHED_MATERIAL;
    }

    get name(): string {
        return 'Buche';
    }

    get finish(): string {
        return 'Klarlack';
    }

    get previewImageUrl(): string {
        return 'images/beech_bare.jpg';
    }
}

class EscheGeoelt extends ShelfMaterial {
    protected createMaterial(): BABYLON.Material {
        return Resources.ASH_OILED_MATERIAL;
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

class EscheKlarlack extends ShelfMaterial {
    protected createMaterial(): BABYLON.Material {
        return Resources.ASH_VARNISHED_MATERIAL;
    }

    get name(): string {
        return 'Esche';
    }

    get finish(): string {
        return 'Klarlack';
    }

    get previewImageUrl(): string {
        return 'images/ash_bare.jpg';
    }
}

class NussbaumGeoelt extends ShelfMaterial {
    protected createMaterial(): BABYLON.Material {
        return Resources.WALLNUT_OILED_MATERIAL;
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

class NussbaumKlarlack extends ShelfMaterial {
    protected createMaterial(): BABYLON.Material {
        return Resources.WALLNUT_VARNISHED_MATERIAL;
    }

    get name(): string {
        return 'Nussbaum';
    }

    get finish(): string {
        return 'Klarlack';
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
        return Resources.STAINLESS_BRUSHED_MATERIAL;
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
        return Resources.BRASS_BRUSHED_MATERIAL;
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
    new BucheGeoelt(),
    new BucheKlarlack(),
    new EscheGeoelt(),
    new EscheKlarlack(),
    new NussbaumGeoelt(),
    new NussbaumKlarlack(),
];

export const METAL_MATERIALS : ShelfMaterial[] = [
    new PulverbeschichtetSchwarz(),
    new EdelstahlGebuerstet(),
    new MessingGebuerstet(),
];