import { CustomElement } from "./customElement";

require('./color_swatch.css');

export class ColorSwatch extends CustomElement {
    private root: HTMLElement;
    private static index: number = 0;

    constructor(previewImageUrl: string, onclick: () => void, name: string, startsChecked: boolean = false) {
        super();

        this.root = document.createElement('div');
        this.root.id = 'swatchContainer';

        const radio = document.createElement('input');
        radio.id = `swatch_radio_${ColorSwatch.index++}`;
        radio.type = 'radio';
        radio.value = radio.id;
        radio.name = name;
        radio.checked = startsChecked;
        radio.addEventListener('click', onclick);
        this.root.appendChild(radio);

        const label = document.createElement('label');
        label.setAttribute('for', radio.id);
        this.root.appendChild(label);

        const image = document.createElement('img');
        image.src = previewImageUrl;
        label.appendChild(image);
    }

    get rootElement(): HTMLElement {
        return this.root;
    }
}