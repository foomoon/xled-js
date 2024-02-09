import { Led } from "./led.js";
/**
 * A frame of LEDs, used when you wish to set color pixel by pixel
 *
 * @export
 * @class Frame
 * @typedef {Frame}
 */
export declare class Frame {
    leds: Led[];
    /**
     * Creates an instance of Frame.
     *
     * @constructor
     * @param {Led[]} leds Array of Led, of same length as nleds
     */
    constructor(leds: Led[]);
    /**
     * Output the frame as a Uint8Array of bytes
     *
     * @returns {Uint8Array}
     */
    toOctet(): Uint8Array;
    fromOctet(octet: Uint8Array): void;
    /**
     * Get the number of LEDs in this frame
     *
     * @returns {number}
     */
    getNLeds(): number;
}
