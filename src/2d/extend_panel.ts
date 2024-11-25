import { CustomElement } from "./customElement";
require('./extend_panel.css');

export class ExtendPanel extends CustomElement {
    private root: HTMLElement;
    private topBar: HTMLElement;
    private body: HTMLElement;

    constructor(options?: {startsExtended?: boolean, topBarName?: string, onBackClick?: () => void}) {
        super();

        this.root = document.createElement("div");
        this.root.id = "extendPanel";
        this.setVisiblity(options?.startsExtended ?? false);

        if (options?.topBarName) {
            this.topBar = document.createElement("div");
            this.topBar.id = "extendTopBar";
            this.root.appendChild(this.topBar);

            if (options.onBackClick) {
                const backButton = document.createElement("button");
                backButton.id = "backButton";
                backButton.innerText = '⟵';
                backButton.addEventListener('click', options.onBackClick);
                this.topBar.appendChild(backButton);
            }

            const title = document.createElement("h2");
            title.id = "extendTitle";
            title.innerText = options.topBarName;
            this.topBar.appendChild(title);
        }

        this.body = document.createElement('div');
        this.body.id = 'extendBody';
        this.root.appendChild(this.body);
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