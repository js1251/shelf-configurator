import { ModelLoader } from "../3d/modelloader";
import { Entity } from "./entity";
import { ProductOptions } from "../shelf/product_options";
import { LiteEvent } from "../event_engine/LiteEvent";

export abstract class ProductEntity extends Entity {
    private readonly onMaterialChanged = new LiteEvent<string>();
    public get MaterialChanged() {
        return this.onMaterialChanged.expose();
    }

    protected readonly onPriceChanged = new LiteEvent<number>();
    public get PriceChanged() {
        return this.onPriceChanged.expose();
    }
    
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

    private _material: string;
    public set material(material: string) {
        this._material = material;
        this.applyMaterial(material);
        this.onMaterialChanged.trigger(material);
        this.onPriceChanged.trigger(this.getPrice());
    }

    public get material(): string {
        return this._material;
    }

    protected abstract applyMaterial(material: string): void;
}