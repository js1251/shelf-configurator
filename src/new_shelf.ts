
export class new_shelf {
    private height_m: number; // height in meters
    private numberOfStruts: number;

    constructor() {
        this.height_m = 2.4;
        this.numberOfStruts = 2;
    }

    getHeight() : number {
        return this.height_m;
    }

    setHeight(height_m: number) {
        // cant be higher than 655.35 meters (due to serialization using two bytes for height)
        if (height_m > 655.35) {
            throw new Error("Height is too high");
        }

        if (height_m < 0) {
            throw new Error("Height is too low");
        }

        this.height_m = height_m;
    }

    getNumberOfStruts() : number {
        return this.numberOfStruts;
    }

    setNumberOfStruts(numberOfStruts: number) {
        // cant be higher than 16 (due to serialization using one hex place for number of struts)
        if (numberOfStruts > 16) {
            throw new Error("Number of struts is too high");
        }

        if (numberOfStruts < 2) {
            throw new Error("Number of struts is too low");
        }

        if (numberOfStruts % 1 !== 0) {
            throw new Error("Number of struts must be an integer");
        }

        this.numberOfStruts = numberOfStruts;
    }

    serialize() : string {
        var serialized = "";
        
        // serialize height in two bytes
        console.log("serializing height: " + this.height_m);
        const height = this.height_m * 100;
        const height_bytes = new Uint16Array([height]);
        // serialize as hex string (big endian, padded with leading zeros)
        serialized += height_bytes[0].toString(16).padStart(4, "0");
        console.log(serialized);

        // serialize number of struts in one byte
        console.log("serializing number of struts: " + this.numberOfStruts);
        const numberOfStruts = this.numberOfStruts - 1;
        // serialize as hex string (big endian, remove leading zeros)
        serialized += numberOfStruts.toString(16);
        console.log(serialized);

        return serialized;
    }

    static deserialize(data: string) : new_shelf {
        const shelf = new new_shelf();

        // first four chars are the height in hex
        shelf.setHeight(parseInt(data.substr(0, 4), 16) / 100);
        console.log("deserialized height: " + shelf.getHeight());

        // next char is the number of struts in hex with leading zeros removed
        shelf.setNumberOfStruts(parseInt(data.substr(4, 1), 16) + 1);
        console.log("deserialized number of struts: " + shelf.getNumberOfStruts());

        

        return shelf;
    }
}