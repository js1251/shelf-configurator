export class ProductOptions {    
    private static _availableBoardLengths: number[] = [];
    public static get availableBoardLengths(): number[] {
        return this._availableBoardLengths;
    }

    private static _availableWoodTypes: string[] = [];
    public static get availableWoodTypes(): string[] {
        return this._availableWoodTypes;
    }

    private static _availableWoodFinishes: string[] = [];
    public static get availableWoodFinishes(): string[] {
        return this._availableWoodFinishes;
    }

    private static _availableStrutHeights: number[] = [];
    public static get availableStrutHeights(): number[] {
        return this._availableStrutHeights;
    }

    private static _availableStrutMaterials: string[] = [];
    public static get availableStrutMaterials(): string[] {
        return this._availableStrutMaterials;
    }

    private static _data: {} = {};
    public static getImageUrlsForSKU(sku: string): string[] {
        return this._data[sku]['image_urls'];
    }

    public static getPriceForSKU(sku: string): number | null {
        return this._data[sku]['price'];
    }

    public static getDescriptionsForSKU(sku: string): string {
        return this._data[sku]['description'];
    }

    public static getNameForSKU(sku: string): string {
        return this._data[sku]['name'];
    }

    public static getShopLinkForSKU(sku: string): string {
        return this._data[sku]['shop_link'];
    }
    
    public async loadOptions(): Promise<void> {
        try {
            const response = await fetch('https://www.serenepieces.com/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },

                // get all products
                body: new URLSearchParams({
                    action: 'get_all_product_info',
                }),
            });
    
            const data = await response.json();
    
            if (data.success) {
                this.parseData(data.data);
            } else {
                console.error('Error fetching product options:', data);
            }
        } catch (err) {
            console.error('AJAX error:', err);
        }
    }

    private parseData(data: {}): void {
        Object.keys(data['variations_info']).forEach((variation_sku) => {
            ProductOptions._data[variation_sku] = {
                name: data['variations_info'][variation_sku]['name'],
                description: data['variations_info'][variation_sku]['description'],
                price: parseFloat(data['variations_info'][variation_sku]['price']),
                image_urls: data['variations_info'][variation_sku]['image_urls'],
                shop_link: data['variations_info'][variation_sku]['shop_url'],
            };
            
            const splitName = variation_sku.split('-');
            if (splitName[0] === 'BOARD') {
                const woodType = splitName[1];
                if (!ProductOptions._availableWoodTypes.includes(woodType)) {
                    ProductOptions._availableWoodTypes.push(woodType);
                }

                const finish = splitName[2];
                if (!ProductOptions._availableWoodFinishes.includes(finish)) {
                    ProductOptions._availableWoodFinishes.push(finish);
                }
                
                const length = parseInt(splitName[3]);
                if (!ProductOptions._availableBoardLengths.includes(length)) {
                    ProductOptions._availableBoardLengths.push(length);
                }
            } else if (splitName[0] === 'STRUT') {
                const material = splitName[1];
                if (!ProductOptions._availableStrutMaterials.includes(material)) {
                    ProductOptions._availableStrutMaterials.push(material);
                }

                const height = parseInt(splitName[2]);
                if (!ProductOptions._availableStrutHeights.includes(height)) {
                    ProductOptions._availableStrutHeights.push(height);
                }
            }
        });
    }
}