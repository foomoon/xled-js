import { Led } from "./led.js";

/**
 * A frame of LEDs, used when you wish to set color pixel by pixel
 *
 * @export
 * @class Frame
 * @typedef {Frame}
 */
export class Frame {
  leds: Led[];

  /**
   * Creates an instance of Frame.
   *
   * @constructor
   * @param {Led[]} leds Array of Led, of same length as nleds
   */
  constructor(leds: Led[]) {
    this.leds = leds;
  }

  /**
   * Output the frame as a Uint8Array of bytes
   *
   * @returns {Uint8Array}
   */
  toOctet(): Uint8Array {
    let bytes = this.leds.map((led) => {
      return led.toOctet();
    });
    let output = new Uint8Array(this.leds.length * 3);
    let offset = 0;
    bytes.forEach((item) => {
      output.set(item, offset);
      offset += item.length;
    });
    return output;
  }

  /**
   * Get the number of LEDs in this frame
   *
   * @returns {number}
   */
  getNLeds(): number {
    return this.leds.length;
  }
}
