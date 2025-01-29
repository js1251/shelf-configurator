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
    private parentGrid: HTMLElement;
    private container: HTMLElement;
    private extendContainer: HTMLElement;
    private currentExtendPanel: ExtendPanel;

    private shelf: Shelf;
    private environment: Environment;

    constructor(parentGrid: HTMLElement, shelf: Shelf, environment: Environment) {
        this.parentGrid = parentGrid;
        this.shelf = shelf;
        this.environment = environment;

        this.container = document.createElement("div");
        this.container.id = "controlPanel";
        this.parentGrid.appendChild(this.container);

        this.createControlPanel();
    }

    setSelectedProduct(product: ProductEntity) {
        if (this.currentExtendPanel) {
            this.currentExtendPanel.closeAndRemove();
        }

        if (product) {
            this.currentExtendPanel = new ProductExtendPanel(product);
            this.openExtendPanel(this.currentExtendPanel);
        }
    }

    private openExtendPanel(extendPanel: ExtendPanel) {
        this.extendContainer.appendChild(extendPanel.rootElement);

        // delay to show animation
        setTimeout(() => {
            extendPanel.setVisiblity(true);
        });
    }

    private async createControlPanel() {
        const summaryContainer = document.createElement("div");
        summaryContainer.id = "summaryContainer";
        this.container.appendChild(summaryContainer);

        const totalPrice = new PriceDisplay();
        this.shelf.getTotalPrice().then((price) => {
            totalPrice.setAmount(price);
        });
        this.shelf.BboxChanged.on(() => {
            this.shelf.getTotalPrice().then((price) => {
                totalPrice.setAmount(price);
            });
        });
        this.shelf.BoardSizeChanged.on(() => {
            this.shelf.getTotalPrice().then((price) => {
                totalPrice.setAmount(price);
            });
        });
        summaryContainer.appendChild(totalPrice.rootElement);

        const orderButton = document.createElement("button");
        orderButton.className = "button button-primary";
        orderButton.innerHTML = "Bestellen";

        orderButton.disabled = true;

        orderButton.addEventListener('click', () => {
            console.log("order button clicked");
        });
        summaryContainer.appendChild(orderButton);

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

        this.extendContainer = document.createElement("div");
        this.extendContainer.id = "extendContainer";
        this.container.appendChild(this.extendContainer);
        
        const controlPanel = new ExtendPanel({startsExtended: true});
        this.extendContainer.appendChild(controlPanel.rootElement);        
        controlPanel.appendToBody(buttonContainer);
    }

    private createSectionButton(text: string, onClick: () => void) : HTMLButtonElement {
        const button = document.createElement("button");
        button.id = "sectionButton";
        button.className = "button button-inverted";
        button.addEventListener('click', onClick);
        
        const name = document.createElement("h4");
        name.id = "sectionName";
        name.innerText = text;
        button.appendChild(name);

        const icon = document.createElement("h4");
        icon.innerHTML = "⟶";
        button.appendChild(icon);

        return button;
    }
}