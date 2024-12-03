require("./price_display.css");

export class PriceDisplay {
    private root: HTMLElement;
    private intAmount: HTMLSpanElement;
    private decimelAmount: HTMLSpanElement;
    
    constructor() {
        const container = document.createElement("div");
        container.id = "priceDisplay";
        this.root = container;

        const currencySymbol = document.createElement("h5");
        currencySymbol.innerHTML = "€";
        currencySymbol.id = "currencySymbol";
        container.appendChild(currencySymbol);

        this.intAmount = document.createElement("h2");
        this.intAmount.id = "intAmount";
        container.appendChild(this.intAmount);

        this.decimelAmount = document.createElement("h5");
        this.decimelAmount.id = "decimelAmount";
        container.appendChild(this.decimelAmount);

        this.setAmount(0);
    }

    setFontSize(size: number) {
        // set the font size of the amount
    }

    setAmount(amount: number) {
        let intString = Math.floor(amount) + "";
        // add space every 3 digits
        intString = intString.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

        this.intAmount.innerHTML = intString;
        this.decimelAmount.innerHTML = "." + ((amount - Math.floor(amount))* 100).toFixed(0).padStart(2, "0");
    }
    
    get rootElement() {
        return this.root;
    }
}