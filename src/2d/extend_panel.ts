import { CustomElement } from "./customElement";
require('./extend_panel.css');

export class ExtendPanel extends CustomElement {
    private root: HTMLElement;
    private topBar: HTMLElement;
    private body: HTMLElement;

    constructor(startsExtended: boolean = false) {
        super();

        this.root = document.createElement("div");
        this.root.id = "extendPanel";
        this.setVisiblity(startsExtended);

        this.topBar = document.createElement("div");
        this.topBar.id = "extendTopBar";
        this.root.appendChild(this.topBar);

        this.body = document.createElement('div');
        this.body.id = 'extendBody';
        this.root.appendChild(this.body);
    }

    appendToTopBar(child: HTMLElement) {
        this.topBar.appendChild(child);
    }

    appendToBody(child: HTMLElement) {
        this.body.appendChild(child);
    }

    get rootElement() {
        return this.root;
    }

    setVisiblity(visible: boolean) {
        if (visible) {
            this.root.classList.remove("hidden");
            this.root.classList.add("visible");
        } else {
            this.root.classList.remove("visible");
            this.root.classList.add("hidden");
        }
    }

    closeAndRemove() {
        this.setVisiblity(false);

        this.rootElement.addEventListener('transitionend', () => {
            this.rootElement.remove();
        });
    }
}