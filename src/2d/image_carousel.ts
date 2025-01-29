import { CustomElement } from "./customElement";
require('./image_carousel.css');

export class ImageCarousel extends CustomElement {
    private div: HTMLElement;
    private image: HTMLImageElement;

    private imageUrls: string[] = ["https://serenepieces.com/wp-content/uploads/woocommerce-placeholder.png"];
    private currentIndex: number = 0;

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
    }

    private initializeCarousel() {
        this.div = document.createElement("div");
        this.div.id = "carousel";
        
        // show buttons when hovering over the carousel
        this.div.addEventListener('mouseenter', () => {
            document.getElementById("leftButton").classList.remove("hidden");
            document.getElementById("rightButton").classList.remove("hidden");
            document.getElementById("leftButton").classList.add("visible");
            document.getElementById("rightButton").classList.add("visible");
        });
        this.div.addEventListener('mouseleave', () => {
            document.getElementById("leftButton").classList.add("hidden");
            document.getElementById("rightButton").classList.add("hidden");
            document.getElementById("leftButton").classList.remove("visible");
            document.getElementById("rightButton").classList.remove("visible");
        });


        this.image = document.createElement("img");
        this.image.src = this.imageUrls[this.currentIndex];

        this.div.appendChild(this.image);

        const leftButton = document.createElement("button");
        leftButton.className = "button button-secondary button-rounded";
        leftButton.classList.add("active");
        leftButton.classList.add("hidden");
        leftButton.innerHTML = "⟵";
        leftButton.id = "leftButton";
        leftButton.addEventListener('click', () => {
            this.setActiveImage((this.currentIndex - 1 + this.imageUrls.length) % this.imageUrls.length);
        });
        this.div.appendChild(leftButton);

        const rightButton = document.createElement("button");
        rightButton.className = "button button-secondary button-rounded";
        rightButton.classList.add("active");
        rightButton.classList.add("hidden");
        rightButton.innerHTML = "⟶";
        rightButton.id = "rightButton";
        rightButton.addEventListener('click', () => {
            this.setActiveImage((this.currentIndex + 1) % this.imageUrls.length);
        });
        this.div.appendChild(rightButton);
    }

    private rebuildCarousel() {
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
        }
        
        this.setActiveImage(0);
    }

    get rootElement() {
        return this.div;
    }
}