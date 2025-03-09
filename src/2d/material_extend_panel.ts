import * as Resources from "../shelf/materials";
import { ProductOptions } from "../shelf/product_options";
import { Shelf } from "../shelf/shelf";
import { ColorSwatch } from "./color_swatch";
import { ExtendPanel } from "./extend_panel";

require('./material_extend_panel.css');

export class MaterialExtendPanel extends ExtendPanel {
    private shelf: Shelf;

    constructor(shelf: Shelf) {
        super({topBarName: 'Material', onBackClick: () => {
            this.closeAndRemove();
        }});

        this.shelf = shelf;

        this.createMaterialSelectionSection('Holzart Böden', ProductOptions.availableWoodTypes, this.shelf.getBoards()[0].material, (material) => {
            this.shelf.setBoardMaterial(material);
        });

        this.createMaterialSelectionSection('Metall Streben', ProductOptions.availableStrutMaterials, this.shelf.getStruts()[0].material, (material) => {
            this.shelf.setStrutMaterial(material);
        });
    }

    private createMaterialSelectionSection(name: string, materials: string[], initialMaterialName: string, onSwatchPicked: (material: string) => void) {
        const shelfMaterial = Resources.getShelfMaterialForStringMaterial(initialMaterialName);
        
        const materialSelectionContainer = document.createElement('div');
        materialSelectionContainer.id = 'materialSelectionContainer';
        this.appendToBody(materialSelectionContainer);

        const previewContainer = document.createElement('div');
        previewContainer.id = 'materialPreviewContainer';
        materialSelectionContainer.appendChild(previewContainer);

        const preview = document.createElement('img');
        preview.src = ProductOptions.getMaterialThumbnailUrl(initialMaterialName);
        preview.id = 'materialPreview';
        previewContainer.appendChild(preview);

        const materialInfoContainer = document.createElement('div');
        materialInfoContainer.id = 'materialInfoContainer';
        previewContainer.appendChild(materialInfoContainer);

        const materialType = document.createElement('h3');
        materialType.innerHTML = name;
        materialInfoContainer.appendChild(materialType);

        const materialNameTitle = document.createElement('p');
        materialNameTitle.innerHTML = shelfMaterial.name;
        materialInfoContainer.appendChild(materialNameTitle);

        const materialFinish = document.createElement('p');
        materialFinish.innerHTML = shelfMaterial.finish;
        materialInfoContainer.appendChild(materialFinish);

        const swatchScrollContainer = document.createElement('div');
        swatchScrollContainer.id = 'swatchesScrollContainer';
        materialSelectionContainer.appendChild(swatchScrollContainer);
        
        const swatchContainer = document.createElement('div');
        swatchContainer.id = 'swatchesContainer';
        swatchScrollContainer.appendChild(swatchContainer);

        for (let i = 0; i < materials.length; i++) {
            const materialThumbnailUrl = ProductOptions.getMaterialThumbnailUrl(materials[i]);
            const swatch = new ColorSwatch(materialThumbnailUrl, () => {
                onSwatchPicked(materials[i]);
                preview.src = materialThumbnailUrl;
                materialNameTitle.innerHTML = shelfMaterial.name;
                materialFinish.innerHTML = shelfMaterial.finish;
            }, name, materials[i] === initialMaterialName);
            swatchContainer.append(swatch.rootElement);
        }
    }
}