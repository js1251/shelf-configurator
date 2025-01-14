import { ILoadingScreen } from "@babylonjs/core";
require("./shelf_loading_screen.css");

export class ShelfLoadingScreen implements ILoadingScreen {
    public loadingUIBackgroundColor: string;
    public loadingUIText: string;

    constructor() {
        this.loadingUIBackgroundColor = "white";
        this.loadingUIText = "Loading, please wait...";
    }

    public displayLoadingUI() {
        const size = 65;
        const strokeWidth = 6;
        const sizePlus = size + 1;
        const sizeHalf = sizePlus / 2;
        const radius = (sizePlus - strokeWidth) / 2;
        const loadingDiv = document.createElement("div");
        loadingDiv.innerHTML = `<svg class="shelf-spinner" width="${size}px" height="${size}px" viewBox="0 0 ${sizePlus} ${sizePlus}" xmlns="http://www.w3.org/2000/svg">
                                    <circle class="shelf-spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="${sizeHalf}" cy="${sizeHalf}" r="${radius}"></circle>
                                </svg>`;
        loadingDiv.id = "shelf-loading-container";

        document.body.appendChild(loadingDiv);
    }
    public hideLoadingUI() {
        const loadingDiv = document.getElementById("shelf-loading-container");
        if (loadingDiv) {
            document.body.removeChild(loadingDiv);
        }
    }
}