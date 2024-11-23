import { METAL_MATERIALS, ShelfMaterial, WOOD_MATERIALS } from "../shelf/materials";
import { Shelf } from "../shelf/shelf";
import { ColorSwatch } from "./color_swatch";
import { ExtendPanel } from "./extend_panel";
import * as ICON from "./icons";

require('./material_extend_panel.css');

export class MaterialExtendPanel extends ExtendPanel {
    private shelf: Shelf;

    constructor(shelf: Shelf) {
        super();

        this.shelf = shelf;

        const closeButton = document.createElement("button");
        closeButton.className = "button button-rounded";
        closeButton.innerHTML = ICON.close;
        closeButton.addEventListener('click', () => {
            this.closeAndRemove();
        });
        this.appendToTopBar(closeButton);

        this.createMaterialSelectionSection('Wood Selection', WOOD_MATERIALS, (shelfMaterial) => {
            this.shelf.getBoards().forEach(board => {
                board.setMaterial(shelfMaterial.material);
            });
        });

        this.createMaterialSelectionSection('Metal Selection', METAL_MATERIALS, (shelfMaterial) => {
            this.shelf.getStruts().forEach(strut => {
                strut.setMaterial(shelfMaterial.material);
            });
        });
    }

    private createMaterialSelectionSection(name: string, materials: ShelfMaterial[], onSwatchPicked: (shelfMaterial: ShelfMaterial) => void) {
        const materialSelectionContainer = document.createElement('div');
        materialSelectionContainer.id = 'materialSelectionContainer';
        this.appendToBody(materialSelectionContainer);
        
        const label = document.createElement('h1');
        label.innerHTML = name;
        materialSelectionContainer.appendChild(label);

        const previewContainer = document.createElement('div');
        previewContainer.id = 'materialPreviewContainer';
        materialSelectionContainer.appendChild(previewContainer);

        const preview = document.createElement('img')
        preview.src = materials[0].previewImageUrl;
        preview.id = 'materialPreview';
        previewContainer.appendChild(preview);

        const materialInfoContainer = document.createElement('div');
        materialInfoContainer.id = 'materialInfoContainer';
        previewContainer.appendChild(materialInfoContainer);

        const materialName = document.createElement('h3');
        materialName.innerHTML = materials[0].name;
        materialInfoContainer.appendChild(materialName);

        const materialFinish = document.createElement('p');
        materialFinish.innerHTML = materials[0].finish;
        materialInfoContainer.appendChild(materialFinish);        
        
        const swatchContainer = document.createElement('div');
        swatchContainer.id = 'swatchesContainer';
        materialSelectionContainer.appendChild(swatchContainer);

        for (let i = 0; i < materials.length; i++) {
            const shelfMaterial = materials[i];
            const swatch = new ColorSwatch(shelfMaterial, () => {
                onSwatchPicked(shelfMaterial);
            }, name, i==0);
            swatchContainer.append(swatch.rootElement);
        }
    }
}