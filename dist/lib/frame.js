/**
 * A frame of LEDs, used when you wish to set color pixel by pixel
 *
 * @export
 * @class Frame
 * @typedef {Frame}
 */
export class Frame {
    /**
     * Creates an instance of Frame.
     *
     * @constructor
     * @param {Led[]} leds Array of Led, of same length as nleds
     */
    constructor(leds) {
        this.leds = leds;
    }
    /**
     * Output the frame as a Uint8Array of bytes
     *
     * @returns {Uint8Array}
     */
    toOctet() {
        const channels = this.leds[0].type.length || 3;
        const buffer = new ArrayBuffer(this.leds.length * channels);
        const output = new Uint8Array(buffer);
        let offset = 0;
        this.leds.forEach((led) => {
            output.set(led.toOctet(), offset);
            offset += channels;
        });
        return output;
    }
    /**
     * Get the number of LEDs in this frame
     *
     * @returns {number}
     */
    getNLeds() {
        return this.leds.length;
    }
}
