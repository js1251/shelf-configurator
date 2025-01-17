import { CustomElement } from "./customElement";
import * as ICON from "./icons";
require('./image_carousel.css');

export class ImageCarousel extends CustomElement {
    private div: HTMLElement;
    private indexIndicatorContainer: HTMLElement;
    private image: HTMLImageElement;

    private imageUrls: string[] = ["https://serenepieces.com/wp-content/uploads/woocommerce-placeholder.png"];
    private currentIndex: number = 0;

    private indexButtons: HTMLButtonElement[] = [];

    constructor() {
        super();
        this.initializeCarousel();
    }

    setImages(imageUrls: string[]) {
        this.imageUrls = imageUrls;
        this.rebuildCarousel();
    }

    private setActiveImage(index: number) {
        this.currentIndex = index;
        this.image.src = this.imageUrls[this.currentIndex];

        // update index indicators buttons
        this.indexButtons[this.currentIndex].classList.add("active");

        for (let i = 0; i < this.imageUrls.length; i++) {
            if (i !== this.currentIndex) {
                this.indexButtons[i].classList.remove("active");
            }
        }
    }

    private initializeCarousel() {
        this.div = document.createElement("div");
        this.div.id = "carousel";

        this.image = document.createElement("img");
        this.image.src = this.imageUrls[this.currentIndex];
        this.div.appendChild(this.image);

        const leftButton = document.createElement("button");
        // create a left arrow from line drawing
        leftButton.innerHTML = ICON.carouselArrowLeft;
        leftButton.id = "leftButton";
        leftButton.addEventListener('click', () => {
            this.setActiveImage((this.currentIndex - 1 + this.imageUrls.length) % this.imageUrls.length);
        });
        this.div.appendChild(leftButton);

        const rightButton = document.createElement("button");
        rightButton.innerHTML = ICON.carouselArrowRight;
        rightButton.id = "rightButton";
        rightButton.addEventListener('click', () => {
            this.setActiveImage((this.currentIndex + 1) % this.imageUrls.length);
        });
        this.div.appendChild(rightButton);

        this.indexIndicatorContainer = document.createElement("div");
        this.indexIndicatorContainer.id = "indexIndicatorContainer";
        this.div.appendChild(this.indexIndicatorContainer);
    }

    private rebuildCarousel() {
        // remove all index buttons
        this.indexButtons.forEach((button) => {
            button.remove();
        });

        this.indexButtons = [];

        // add a button per image
        for (let i = 0; i < this.imageUrls.length; i++) {
            const indexIndicator = document.createElement("button");
            indexIndicator.id = "indexIndicator";
            
            if (i === this.currentIndex) {
                indexIndicator.classList.add("active");
            }

            indexIndicator.addEventListener('click', () => {
                this.setActiveImage(i);
            });

            this.indexIndicatorContainer.appendChild(indexIndicator);
            this.indexButtons.push(indexIndicator);
        }
        
        this.setActiveImage(0);
    }

    get rootElement() {
        return this.div;
    }
}