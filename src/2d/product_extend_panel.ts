import { ExtendPanel } from "./extend_panel";
import * as ICON from "./icons";
import { ImageCarousel } from "./image_carousel";
import { PriceDisplay } from "./priceDisplay";
import { ProductEntity } from "../entity_engine/product_entity";
require('./product_extend_panel.css');

export class ProductExtendPanel extends ExtendPanel {
    constructor(product: ProductEntity) {
        super();

        const closeButton = document.createElement("button");
        closeButton.className = "button button-rounded";
        closeButton.innerHTML = ICON.close;
        closeButton.addEventListener('click', () => {
            this.closeAndRemove();
        });
        this.appendToTopBar(closeButton);

        const images = new ImageCarousel(product.imageUrls);
        this.appendToBody(images.rootElement);

        const contentContainer = document.createElement("div");
        contentContainer.id = "contentContainer";
        this.appendToBody(contentContainer);

        const title = document.createElement("h2");
        title.innerText = product.name;
        contentContainer.appendChild(title);

        const description = document.createElement("p");
        description.style.opacity = "0.7";
        description.innerText = product.description;
        contentContainer.appendChild(description);

        const readMore = document.createElement("a");
        readMore.href = "https://www.google.com"; // TODO: proper link
        readMore.target = "_blank";
        readMore.rel = "noopener noreferrer";
        readMore.style.opacity = "0.7";
        readMore.innerText = "Mehr info";
        contentContainer.appendChild(readMore);

        const price = new PriceDisplay();
        price.setAmount(product.price);
        contentContainer.appendChild(price.rootElement);

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

        const extendSize = product.getBoundingBox().extendSize;
        const properties = [
            { name: "Breite:", value: getMeasurementString(extendSize.x * 2) },
            { name: "Höhe:", value: getMeasurementString(extendSize.y * 2) },
            { name: "Tiefe:", value: getMeasurementString(extendSize.z * 2) },
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
    }
}