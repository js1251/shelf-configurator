export class PriceDisplay {
    private intAmount: HTMLSpanElement;
    private decimelAmount: HTMLSpanElement;
    
    constructor(parent: HTMLElement) {
        const container = document.createElement("div");
        container.id = "priceDisplay";
        parent.appendChild(container);

        const currencySymbol = document.createElement("h3");
        currencySymbol.innerHTML = "€";
        currencySymbol.id = "currencySymbol";
        container.appendChild(currencySymbol);

        this.intAmount = document.createElement("h1");
        this.intAmount.id = "intAmount";
        container.appendChild(this.intAmount);

        this.decimelAmount = document.createElement("h3");
        this.decimelAmount.id = "decimelAmount";
        container.appendChild(this.decimelAmount);

        this.setAmount(0);
    }

    setFontSize(size: number) {
        // set the font size of the amount
    }

    setAmount(amount: number) {
        this.intAmount.innerHTML = Math.floor(amount) + "";
        this.decimelAmount.innerHTML = "." + ((amount - Math.floor(amount))* 100).toFixed(0).padStart(2, "0");
    }
}