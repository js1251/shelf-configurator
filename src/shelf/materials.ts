class ShelfMaterial {
    private _rawMaterial: string;
    private _finish: string;
    private _previewImageUrl: string;
    private _solidColorHex: string;
    
    constructor(rawMaterial: string, finish: string, previewImageUrl: string, solidColorHex: string) {
        this._rawMaterial = rawMaterial;
        this._finish = finish;
    }

    get rawMaterial() : string {
        return this._rawMaterial;
    }

    get finish() : string {
        return this._finish;
    }

    get previewImageUrl() : string {
        return this._previewImageUrl;
    }

    get solidColorHex() : string {
        return this._solidColorHex;
    }

}

export class ShelfMaterials {
    public static WoodWalnutOiled = new ShelfMaterial("Walnuss", "Geölt", "PLACEHOLDER", "#8B4513");
    public static WoodWalnutWaxxed = new ShelfMaterial("Walnuss", "Gewachst", "PLACEHOLDER", "#8B4513");

    public static MetalAluminiumBlack = new ShelfMaterial("Aluminium", "Schwarz lackiert", "PLACEHOLDER", "#000000");
    public static MetalBrassCoated = new ShelfMaterial("Messing", "Poliert, Klarlack", "PLACEHOLDER", "#DAA520");
    public static MetalBrassAged = new ShelfMaterial("Messing", "Gealtert", "PLACEHOLDER", "#DAA520");
    public static MetalStainless = new ShelfMaterial("Edelstahl", "Gebürstet", "PLACEHOLDER", "#C0C0C0");
}