import { Entity } from "./entity_engine/entity";
import * as ICON from "./icons";
import { ImageCarousel } from "./image_carousel";
import { PriceDisplay } from "./priceDisplay";
import { Board } from "./shelf/entities/board";
import { Shelf } from "./shelf/shelf";

export class ControlPanel {
    private grid: HTMLDivElement;

    private controlPanel: HTMLDivElement;
    private selectedEntity: Entity;

    constructor(grid: HTMLDivElement, shelf: Shelf) {
        this.grid = grid;

        this.createControlPanel();
    }

    // TODO: different things than board can be selected!
    setSelectedEntity(entity: Entity) {
        if (entity === null) {
            const detailPanel = document.getElementById("detailPanel");

            if (!detailPanel) {
                console.warn("Detail panel not found");
                return;
            }

            detailPanel.classList.add("hidden");
            detailPanel.classList.remove("visible");

            detailPanel.addEventListener('transitionend', () => {
                detailPanel.parentElement.removeChild(detailPanel);
            });

            return;
        }

        if (entity) {
            const detailPanel = this.createDetailPanel(entity);
            setTimeout(() => {
                detailPanel.classList.add("visible");
            });
        }
    }

    private createControlPanel() {
        this.controlPanel = document.createElement("div");
        this.controlPanel.id = "controlPanel";

        this.grid.appendChild(this.controlPanel);
    }

    private createDetailPanel(entity: Entity) : HTMLElement{
        const detailPanel = document.createElement("div");
        detailPanel.id = "detailPanel";

        const topBar = document.createElement("div");
        topBar.id = "topBar";
        detailPanel.appendChild(topBar);

        const closeButton = document.createElement("button");
        closeButton.className = "button button-rounded";
        closeButton.innerHTML = ICON.close;
        closeButton.addEventListener('click', () => {
            this.setSelectedEntity(null);
        });
        topBar.appendChild(closeButton);

        const images = [
            "images/product_placeholder01.jpg",
            "images/product_placeholder02.jpg",
            "images/product_placeholder03.jpg",
        ];
        new ImageCarousel(images, detailPanel);

        const contentContainer = document.createElement("div");
        contentContainer.id = "contentContainer";
        detailPanel.appendChild(contentContainer);

        const title = document.createElement("h2");
        title.innerText = "Shelf Beech Wood";
        contentContainer.appendChild(title);

        const description = document.createElement("p");
        description.style.opacity = "0.7";
        description.innerText = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt";
        contentContainer.appendChild(description);

        const readMore = document.createElement("a");
        readMore.href = "https://www.google.com"; // TODO: proper link
        readMore.target = "_blank";
        readMore.rel = "noopener noreferrer";
        readMore.style.opacity = "0.7";
        readMore.innerText = "more info";
        contentContainer.appendChild(readMore);

        const price = new PriceDisplay(contentContainer);
        price.setAmount(150);

        const propertiesContainer = document.createElement("div");
        propertiesContainer.id = "propertiesContainer";
        contentContainer.appendChild(propertiesContainer);

        const getMeasurementString = (valueInMeter: number) : string => {            
            const trim = (value: number) : string => {
                value = Math.round(value * 1000) / 1000;
                
                // return two decimal places if number is not an integer
                // else return the integer
                if (value % 1 !== 0) {
                    return value.toFixed(2);
                }

                return value.toFixed(0);
            };
            
            // mm
            if (valueInMeter < 0.05) {
                return (valueInMeter * 1000).toFixed(0) + "mm";
            }

            // cm
            if (valueInMeter < 5) {
                return trim(valueInMeter * 100) + "cm";
            }

            // m
            return trim(valueInMeter) + "m";
        };

        // TODO: get properties from entity
        const extendSize = entity.getBoundingBox().extendSize;
        const properties = [
            { name: "Length:", value: getMeasurementString(extendSize.x * 2) },
            { name: "Height:", value: getMeasurementString(extendSize.y * 2) },
            { name: "Depth:", value: getMeasurementString(extendSize.z * 2) },
        ];

        properties.forEach((property) => {
            const propertyElement = document.createElement("div");
            propertyElement.id = "property";

            const propertyName = document.createElement("p");
            propertyName.innerText = property.name;
            propertyName.style.fontWeight = "bold";
            propertyName.style.minWidth = "110px";
            propertyElement.appendChild(propertyName);

            const propertyValue = document.createElement("p");
            propertyValue.innerText = property.value;
            propertyElement.appendChild(propertyValue);

            propertiesContainer.appendChild(propertyElement);
        });

        const line = document.createElement("hr");
        contentContainer.appendChild(line);

        this.controlPanel.appendChild(detailPanel);

        return detailPanel;
    }
}