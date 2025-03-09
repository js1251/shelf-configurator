import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../3d/modelloader";
import { Entity } from "./entity";
import { ProductOptions } from "../shelf/product_options";

export abstract class ProductEntity extends Entity {
    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }

    abstract get SKU(): string;

    public getName(): string {
        return ProductOptions.getNameForSKU(this.SKU);
    }

    public getDescription(): string {
        return ProductOptions.getDescriptionsForSKU(this.SKU);
    }

    public getPrice(): number {        
        return ProductOptions.getPriceForSKU(this.SKU);
    }

    public getImageUrls(): string[] {
        return ProductOptions.getImageUrlsForSKU(this.SKU);
    }

    public getShopLink(): string {
        return ProductOptions.getShopLinkForSKU(this.SKU);
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