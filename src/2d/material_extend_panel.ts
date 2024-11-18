import { ExtendPanel } from "./extend_panel";
import * as ICON from "./icons";
require('./material_extend_panel.css');

export class MaterialExtendPanel extends ExtendPanel {
    constructor() {
        super();

        const closeButton = document.createElement("button");
        closeButton.className = "button button-rounded";
        closeButton.innerHTML = ICON.close;
        closeButton.addEventListener('click', () => {
            this.closeAndRemove();
        });
        this.appendToTopBar(closeButton);
    }
}