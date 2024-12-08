require("./price_display.css");

export class PriceDisplay {
    private root: HTMLElement;
    private intAmount: HTMLSpanElement;
    private decimelAmount: HTMLSpanElement;
    
    constructor() {
        this.root = document.createElement("div");
        this.root.id = "priceDisplay";

        const currencySymbol = document.createElement("h5");
        currencySymbol.innerHTML = "€";
        currencySymbol.id = "currencySymbol";
        this.root.appendChild(currencySymbol);

        this.intAmount = document.createElement("h2");
        this.intAmount.id = "intAmount";
        this.root.appendChild(this.intAmount);

        this.decimelAmount = document.createElement("h5");
        this.decimelAmount.id = "decimelAmount";
        this.root.appendChild(this.decimelAmount);

        this.setAmount(0);
    }

    setAmount(amount: number) {
        let intString = Math.floor(amount) + "";
        // add space every 3 digits
        intString = intString.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

        this.intAmount.innerHTML = intString;
        this.decimelAmount.innerHTML = "." + ((amount - Math.floor(amount))* 100).toFixed(0).padStart(2, "0");
    }

    setDiscount(discount: number) {
        // set the discount
    }
    
    get rootElement() {
        return this.root;
    }
}