import * as ICON from "./icons";

export class ImageCarousel {
    private div: HTMLDivElement;
    private image: HTMLImageElement;

    private imageUrls: string[];
    private currentIndex: number;

    private indexButtons: HTMLButtonElement[] = [];

    constructor(imageUrls: string[], div: HTMLDivElement) {
        this.div = div;
        
        this.imageUrls = imageUrls;
        this.currentIndex = 0;

        this.createCarousel();
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

    private createCarousel() {
        const carousel = document.createElement("div");
        carousel.id = "carousel";

        this.image = document.createElement("img");
        this.image.src = this.imageUrls[this.currentIndex];
        carousel.appendChild(this.image);

        const leftButton = document.createElement("button");
        // create a left arrow from line drawing
        leftButton.innerHTML = ICON.carouselArrowLeft;
        leftButton.id = "leftButton";
        leftButton.addEventListener('click', () => {
            this.setActiveImage((this.currentIndex - 1 + this.imageUrls.length) % this.imageUrls.length);
        });
        carousel.appendChild(leftButton);

        const rightButton = document.createElement("button");
        rightButton.innerHTML = ICON.carouselArrowRight;
        rightButton.id = "rightButton";
        rightButton.addEventListener('click', () => {
            this.setActiveImage((this.currentIndex + 1) % this.imageUrls.length);
        });
        carousel.appendChild(rightButton);

        const indexIndicatorContainer = document.createElement("div");
        indexIndicatorContainer.id = "indexIndicatorContainer";
        carousel.appendChild(indexIndicatorContainer);

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

            indexIndicatorContainer.appendChild(indexIndicator);
            this.indexButtons.push(indexIndicator);
        }

        this.div.appendChild(carousel);
    }
}