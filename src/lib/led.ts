
/**
 * A RGB led
 *
 * @export
 * @class Led
 * @typedef {Led}
 */

export class Led {
  red: number;
  green: number;
  blue: number;
  white?: number;

  private _type: 'rgb'|'rgbw';

  /**
   * Creates an instance of the Led class.
   *
   * @param {number} red - Red value (0-255).
   * @param {number} green - Green value (0-255).
   * @param {number} blue - Blue value (0-255).
   */
  constructor(red: number, green: number, blue: number, white?: number) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.white = white;
    this._type = typeof white === 'number' ? 'rgbw' : 'rgb';
  }

  /**
   * Gets the LED type.
   * @returns {'rgb'|'rgbw'} The LED type.
   */
  get type(): 'rgb' | 'rgbw' {
    return this._type;
  }

  /**
   * Converts the LED to RGBW.
   *
   * @returns {Led} The updated Led instance.
   */
  toRgbw(): this {
    if (this._type === 'rgbw') return this;
    this.white = 0;
    this._type = 'rgbw';
    return this;
  }

  /**
   * Converts the LED to RGB.
   *
   * @param {boolean} [preserveWhite] - If true, the white value will be preserved.
   * @returns {Led} The updated Led instance.
   */
  toRgb(preserveWhite = false): this {
    const white = this.white;
    if (this._type === 'rgb') return this;
    this.white = undefined;
    this._type = 'rgb';

    if (white && preserveWhite) {
      this.brighten(white / 255);
    }

    return this;
  }

  /**
   * Converts the RGB values to a Uint8Array.
   *
   * @returns {Uint8Array} The RGB values in a Uint8Array format.
   */
  toOctet(): Uint8Array {
    return new Uint8Array(
      this._type === 'rgbw'
      ? [this.white!, this.red, this.green, this.blue]
      : [this.red, this.green, this.blue]
    );
  }

  /**
   * Checks if the LED color is turned on (non-zero).
   *
   * @returns {boolean} True if the LED is on, false otherwise.
   */
  isOn(): boolean {
    return this.red > 0 || this.green > 0 || this.blue > 0 || this.white! > 0;
  }

  /**
   * Sets all RGB values to 0, turning the LED off.
   *
   * @returns {Led} The updated Led instance.
   */
  turnOff(): this {
    this.red = 0;
    this.green = 0;
    this.blue = 0;
    this._type === 'rgbw' && (this.white = 0);
    return this;
  }

  /**
   * Sets the RGB values to the specified values.
   *
   * @param {number} red - New red value.
   * @param {number} green - New green value.
   * @param {number} blue - New blue value.
   * @returns {Led} The updated Led instance.
   */
  setColor(red: number, green: number, blue: number, white?: number): this {
    this.red = red;
    this.green = green;
    this.blue = blue;
    if (typeof white === 'number') {
      this.white = white;
      this._type = 'rgbw';
    }
    return this;
  }

  /**
   * Inverts the RGB values.
   *
   * @returns {Led} The updated Led instance.
   */
  invertColor(): this {
    this.red = 255 - this.red;
    this.green = 255 - this.green;
    this.blue = 255 - this.blue;
    typeof this.white === 'number' && (this.white = 255 - this.white);
    return this;
  }

  /**
   * Returns a string representation of the RGB values.
   *
   * @returns {string} String in the format 'rgb(r, g, b)'.
   */
  toString(): string {
    return `${this._type}(${this.red}, ${this.green}, ${this.blue}, ${this.white})`;
  }

  /**
   * Brightens the LED color by a specified factor.
   *
   * @param {number} factor - Brightness factor (e.g., 1.2 is 20% brighter).
   * @returns {Led} The updated Led instance.
   */
  brighten(factor: number): this {
    this.red = Math.min(255, Math.round(this.red * factor));
    this.green = Math.min(255, Math.round(this.green * factor));
    this.blue = Math.min(255, Math.round(this.blue * factor));
    this._type === 'rgbw' && (this.white = Math.min(255, Math.round((this.white || 0) * factor)));
    return this;
  }

  /**
   * Dims the LED color by a specified factor.
   *
   * @param {number} factor - Dim factor (e.g., 0.8 is 20% dimmer).
   * @returns {Led} The updated Led instance.
   */
  dim(factor: number): this {
    this.red = Math.max(0, Math.round(this.red * factor));
    this.green = Math.max(0, Math.round(this.green * factor));
    this.blue = Math.max(0, Math.round(this.blue * factor));
    this._type === 'rgbw' && (this.white = Math.max(0, Math.round((this.white || 0) * factor)));
    return this;
  }

  /**
   * Saturates the LED color by a specified factor.
   *
   * @param {number} factor - Saturation factor (greater than 1 to saturate, between 0 and 1 to desaturate).
   * @returns {Led} The updated Led instance.
   */
  saturate(factor: number): this {
    const average = (this.red + this.green + this.blue) / 3;
    this.red = Math.min(
      255,
      Math.max(0, average + factor * (this.red - average))
    );
    this.green = Math.min(
      255,
      Math.max(0, average + factor * (this.green - average))
    );
    this.blue = Math.min(
      255,
      Math.max(0, average + factor * (this.blue - average))
    );
    this._type === 'rgbw' && (this.white = Math.min(
      255,
      Math.max(0, average + factor * ((this.white || 0) - average))
    ));
    return this;
  }

  /**
   * Desaturates the LED color by a specified factor.
   *
   * @param {number} factor - Desaturation factor (1 for full grayscale, 0 for no change).
   * @returns {Led} The updated Led instance.
   */
  desaturate(factor: number): this {
    const average = (this.red + this.green + this.blue) / 3;
    this.red = this.red + factor * (average - this.red);
    this.green = this.green + factor * (average - this.green);
    this.blue = this.blue + factor * (average - this.blue);
    this._type === 'rgbw' && (this.white = (this.white || 0) + factor * (average - (this.white || 0)));
    return this;
  }
}
