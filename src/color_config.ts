import * as BABYLON from "@babylonjs/core";
require('./color_config.css');

export class ColorConfig {
    private container: HTMLElement;
    private isVisible: boolean;

    constructor(parent: HTMLElement) {
        this.container = document.createElement('div');
        this.container.id = 'colorConfigContainer';
        this.container.classList.add("hidden");
        parent.appendChild(this.container);

        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+D
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'D') {
                this.setVisibility(!this.isVisible);
            }
        });    
    }

    setVisibility(isVisible: boolean) {
        this.isVisible = isVisible;
        if (isVisible) {
            this.container.classList.add("visible");
            this.container.classList.remove("hidden");
        } else {
            this.container.classList.remove("visible");
            this.container.classList.add("hidden");
        }
    }

    private setupInput(name: string): HTMLElement {
        const parameterContainer = document.createElement('div');
        parameterContainer.id = "parameterContainer";
        this.container.appendChild(parameterContainer);

        const label = document.createElement('h5');
        label.innerHTML = name;
        parameterContainer.appendChild(label);

        const inputContainer = document.createElement('div');
        inputContainer.id = "inputContainer";
        parameterContainer.appendChild(inputContainer);

        return inputContainer;
    }

    attachSlider(name: string, options: {initialValue?: number, min?: number, max?: number, step?: number}, onChange: (value: number) => void) {
        const sliderContainer = this.setupInput(name);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = options.min ? options.min.toString() : "0";
        slider.max = options.max ? options.max.toString() : "10";
        slider.step = options.step ? options.step.toString() : '1';
        slider.value = options.initialValue ? options.initialValue.toString() : "5";
        sliderContainer.appendChild(slider);

        const numberInput = document.createElement("input");
        numberInput.type = "number";
        numberInput.min = slider.min;
        numberInput.max = slider.max;
        numberInput.step = slider.step;
        numberInput.value = slider.value;
        sliderContainer.appendChild(numberInput);

        numberInput.addEventListener('input', () => {
            slider.value = numberInput.value;
            onChange(parseFloat(numberInput.value));
        });

        slider.addEventListener('input', () => {
            numberInput.value = slider.value;
            onChange(parseFloat(numberInput.value));
        });
    }

    attachColorPicker(name: string, options: {initialValue?: string}, onChange: (value: string) => void) {
        const colorContainer = this.setupInput(name);

        const picker = document.createElement("input");
        picker.type = "color";
        picker.value = options.initialValue ? options.initialValue : "#000000";
        colorContainer.appendChild(picker);

        const colorCode = document.createElement("p");
        colorCode.innerHTML = picker.value;
        colorContainer.appendChild(colorCode);

        picker.addEventListener('input', () => {
            colorCode.innerHTML = picker.value;
            onChange(picker.value);
        });
    }

    attachAnglePicker(name: string, options: {initialValue?: BABYLON.Vector3}, onChange: (value: BABYLON.Vector3) => void) {
        const angleToNormal = (angle: BABYLON.Vector2): BABYLON.Vector3 => {
            const radius = Math.cos(angle.x);
            return new BABYLON.Vector3(
                radius * Math.cos(angle.y),
                Math.sin(angle.x),
                radius * Math.sin(angle.y)
            );
        };   
        const normalToAngle = (normal: BABYLON.Vector3): BABYLON.Vector2 => {
            return new BABYLON.Vector2(
                Math.asin(normal.y),
                Math.atan2(normal.z, normal.x)
            );
        };
        const radToDegree = (rad: number): number => {
            return rad * (180 / Math.PI);
        } 
        const degreeToRad = (degree: number): number => {
            return degree * (Math.PI / 180);
        }

        const initialAngle = options.initialValue ? normalToAngle(options.initialValue) : BABYLON.Vector2.One();
        const anglePickerContainer = this.setupInput(name);

        const xVectorComponentContainer = document.createElement('div');
        xVectorComponentContainer.id = "vectorComponentContainer";
        anglePickerContainer.appendChild(xVectorComponentContainer);

        const xLabel = document.createElement('p');
        xLabel.innerHTML = 'x:';
        xVectorComponentContainer.appendChild(xLabel);

        const xSlider = document.createElement('input');
        xSlider.type = 'range';
        xSlider.min = "0";
        xSlider.max = "360";
        xSlider.step = '1';
        xSlider.value = radToDegree(initialAngle.x).toString();
        xVectorComponentContainer.appendChild(xSlider);

        const xNumberInput = document.createElement("input");
        xNumberInput.type = "number";
        xNumberInput.min = xSlider.min;
        xNumberInput.max = xSlider.max;
        xNumberInput.step = xSlider.step;
        xNumberInput.value = xSlider.value;
        xVectorComponentContainer.appendChild(xNumberInput);

        const yVectorComponentContainer = document.createElement('div');
        yVectorComponentContainer.id = "vectorComponentContainer";
        anglePickerContainer.appendChild(yVectorComponentContainer);

        const yLabel = document.createElement('p');
        yLabel.innerHTML = 'y:';
        yVectorComponentContainer.appendChild(yLabel);

        const ySlider = document.createElement('input');
        ySlider.type = 'range';
        ySlider.min = "0";
        ySlider.max = "360";
        ySlider.step = '1';
        ySlider.value = radToDegree(initialAngle.y).toString();
        yVectorComponentContainer.appendChild(ySlider);

        const yNumberInput = document.createElement("input");
        yNumberInput.type = "number";
        yNumberInput.min = ySlider.min;
        yNumberInput.max = ySlider.max;
        yNumberInput.step = ySlider.step;
        yNumberInput.value = ySlider.value;
        yVectorComponentContainer.appendChild(yNumberInput);

        const outputLabel = document.createElement('p');
        outputLabel.innerHTML = `(${options.initialValue.x},${options.initialValue.y},${options.initialValue.z})`;
        anglePickerContainer.parentElement.appendChild(outputLabel);

        const updateOnChange = () => {
            const normal = angleToNormal(new BABYLON.Vector2(degreeToRad(parseFloat(xSlider.value)), degreeToRad(parseFloat(ySlider.value))));
            onChange(normal);
            outputLabel.innerHTML = `Vector: (${normal.x.toFixed(3)},${normal.y.toFixed(3)},${normal.z.toFixed(3)})`;
        }

        xNumberInput.addEventListener('input', () => {
            xSlider.value = xNumberInput.value;
            updateOnChange();
        });

        xSlider.addEventListener('input', () => {
            xNumberInput.value = xSlider.value;
            updateOnChange();
        });

        yNumberInput.addEventListener('input', () => {
            ySlider.value = yNumberInput.value;
            updateOnChange();
        });

        ySlider.addEventListener('input', () => {
            yNumberInput.value = ySlider.value;
            updateOnChange();
        });

    }
}