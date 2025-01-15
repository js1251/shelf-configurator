import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../3d/modelloader";
import { Entity } from "./entity";

export abstract class ProductEntity extends Entity {
    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }

    private _oldSKU: string | null = null;
    abstract get SKU(): string;

    abstract get name(): string;

    abstract get description(): string;

    abstract get imageUrls(): string[];

    private _price: number | null = null;
    public async getPrice(): Promise<number | null> {
        if (this._price !== null && this.SKU === this._oldSKU) {
            return this._price;
        }

        const sku = this.SKU;

        try {
            const response = await fetch('https://www.serenepieces.com/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'get_price_by_sku',
                    sku: sku,
                }),
            });
    
            const data = await response.json();
    
            if (data.success) {
                this._price = data.data.price;
                return this._price;
            } else {
                console.error('Error fetching price:', data);
                return null;
            }
        } catch (err) {
            console.error('AJAX error:', err);
            return null;
        }
    }

    public async addToCart(): Promise<void> {
        const sku = this.SKU;

        try {
            const response = await fetch('https://www.serenepieces.com/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'add_to_cart_sku',
                    sku: sku,
                    quantity: "1",
                }),
            });
    
            const data = await response.json();
    
            if (data.success) {
                console.log('Product added to cart:', data);
            } else {
                console.error('Error adding to cart:', data);
            }
        } catch (err) {
            console.error('AJAX error:', err);
        }
    }

    protected getRangeOption(value: number, options: number[]): number {
        let closest = options[0];
        for (let i = 1; i < options.length; i++) {
            if (Math.abs(options[i] - value) < Math.abs(closest - value)) {
                closest = options[i];
            }
        }
        return closest;
    }

    abstract setMaterial(material: BABYLON.Material);

    abstract getMaterial(): BABYLON.Material;
}