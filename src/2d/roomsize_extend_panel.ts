import { Environment } from "../3d/environment";
import { Shelf } from "../shelf/shelf";
import { ExtendPanel } from "./extend_panel";
require('./roomsize_extend_panel.css');

export class RoomsizeExtendPanel extends ExtendPanel {
    private shelf: Shelf;
    private environment: Environment;

    constructor(shelf: Shelf, environment: Environment) {
        super({topBarName: 'Raumgröße', onBackClick: () => {
            this.closeAndRemove();
        }});

        this.shelf = shelf;
        this.environment = environment;

        /*
        this.createRoomSizeInput("Breite", 350, 200, 500, (value) => {
            this.environment.setRoomWidth(value / 100);
        });
        */
        this.createRoomSizeInput("Höhe", 240, 230, 300, (value) => {
            this.environment.setRoomHeight(value / 100);
            this.shelf.setHeight(value / 100);
        });
        /*
        this.createRoomSizeInput("Tiefe", 450, 200, 500, (value) => {
            this.environment.setRoomDepth(value / 100);
        });
        */
    }

    private createRoomSizeInput(name: string, initialValue: number, min: number, max: number, onChange: (value: number) => void) {
        const container = document.createElement("div");
        container.id = "roomSizeInputContainer";
        this.appendToBody(container);

        const topDiv = document.createElement("div");
        topDiv.id = "roomSizeInputLabelContainer";
        container.appendChild(topDiv);

        const label = document.createElement("h5");
        label.innerText = name;
        topDiv.appendChild(label);

        const roomSizeInput = document.createElement("input");
        roomSizeInput.type = "number";
        roomSizeInput.min = min.toString();
        roomSizeInput.max = max.toString();
        roomSizeInput.value = initialValue.toString();
        roomSizeInput.step = "1";
        topDiv.appendChild(roomSizeInput);

        const cmLabel = document.createElement("p");
        cmLabel.innerText = "cm";
        topDiv.appendChild(cmLabel);

        const roomSizeSlider = document.createElement("input");
        roomSizeSlider.type = "range";
        roomSizeSlider.min = min.toString();
        roomSizeSlider.max = max.toString();
        roomSizeSlider.value = initialValue.toString();
        roomSizeSlider.step = "1";
        container.appendChild(roomSizeSlider);

        roomSizeInput.addEventListener('input', () => {
            roomSizeSlider.value = roomSizeInput.value;
            onChange(parseInt(roomSizeInput.value));
        });

        roomSizeSlider.addEventListener('input', () => {
            roomSizeInput.value = roomSizeSlider.value;
            onChange(parseInt(roomSizeInput.value));
        });
    }
}