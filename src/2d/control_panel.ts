import { PriceDisplay } from "../2d/priceDisplay";
import { Shelf } from "../shelf/shelf";
import { ProductEntity } from "../entity_engine/product_entity";
import { ExtendPanel } from "./extend_panel";
import { ProductExtendPanel } from "./product_extend_panel";
import { MaterialExtendPanel } from "./material_extend_panel";
import { RoomsizeExtendPanel } from "./roomsize_extend_panel";
import { Environment } from "../3d/environment";
require("./control_panel.css");

export class ControlPanel {
    private parentGrid: HTMLDivElement;
    private container: HTMLElement;
    private currentExtendPanel: ExtendPanel;

    private shelf: Shelf;
    private environment: Environment;

    constructor(parentGrid: HTMLDivElement, shelf: Shelf, environment: Environment) {
        this.parentGrid = parentGrid;
        this.shelf = shelf;
        this.environment = environment;

        this.container = document.createElement("div");
        this.container.id = "controlPanel";
        this.parentGrid.appendChild(this.container);

        this.createControlPanel();
    }

    setSelectedProduct(product: ProductEntity) {
        if (product === null) {

            if (!this.currentExtendPanel) {
                console.warn("Detail panel not found");
                return;
            }

            this.currentExtendPanel.closeAndRemove();
            return;
        }

        if (product) {
            this.currentExtendPanel = new ProductExtendPanel(product);
            this.openExtendPanel(this.currentExtendPanel);
        }
    }

    private openExtendPanel(extendPanel: ExtendPanel) {
        this.container.appendChild(extendPanel.rootElement);

        // delay to show animation
        setTimeout(() => {
            extendPanel.setVisiblity(true);
        });
    }

    private createControlPanel() {
        const controlPanel = new ExtendPanel(true);
        this.container.appendChild(controlPanel.rootElement);

        const totalPrice = new PriceDisplay();
        totalPrice.setAmount(5587.55);
        controlPanel.appendToTopBar(totalPrice.rootElement);

        const orderButton = document.createElement("button");
        orderButton.className = "button";
        orderButton.id = "orderButton";
        orderButton.innerHTML = "Bestellen";
        orderButton.addEventListener('click', () => {
            console.log("order button clicked");
        });
        controlPanel.appendToTopBar(orderButton);

        const buttonContainer = document.createElement("div");
        buttonContainer.id = "sectionButtonContainer";
        buttonContainer.appendChild(this.createSectionButton("Material", () => {
            this.openExtendPanel(new MaterialExtendPanel(this.shelf));
        }));
        buttonContainer.appendChild(this.createSectionButton("Anordnung", () => {
            
        }));
        buttonContainer.appendChild(this.createSectionButton("Raumgröße", () => {
            this.openExtendPanel(new RoomsizeExtendPanel(this.shelf, this.environment));
        }));
        buttonContainer.appendChild(this.createSectionButton("Inspiration", () => {
            
        }));
        
        controlPanel.appendToBody(buttonContainer);
    }

    private createSectionButton(text: string, onClick: () => void) : HTMLButtonElement {
        const button = document.createElement("button");
        button.id = "sectionButton";
        button.className = "button";
        button.addEventListener('click', onClick);
        
        const name = document.createElement("h2");
        name.id = "sectionName";
        name.innerText = text;
        button.appendChild(name);

        const icon = document.createElement("h2");
        icon.innerHTML = "⟶";
        button.appendChild(icon);

        return button;
    }
}