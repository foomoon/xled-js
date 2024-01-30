export interface rgbColor {
    /** Red 0..255 */
    red: number;
    /** Green 0..255 */
    green: number;
    /** Blue 0..255 */
    blue: number;
}
export interface hsvColor {
    /** Hue 0..359 */
    hue: number;
    /** Saturation 0..255 */
    saturation: number;
    /** Value (brightness) 0..255 */
    value: number;
}
export declare enum deviceMode {
    demo = "demo",
    color = "color",
    off = "off",
    effect = "effect",
    movie = "movie",
    playlist = "playlist",
    rt = "rt"
}
export declare enum applicationResponseCode {
    Ok = 1000,
    error = 1001,
    invalidArgumentValue = 1101,
    valueTooLong = 1102,
    malformedJSON = 1104,
    invalidArgumentKey = 1105,
    firmwareUpgradeSHA1SUMerror = 1205
}
export interface timer {
    /** Current time according to the device, seconds after midnight */
    time_now: number;
    /** Time to switch lights on, seconds after midnight. -1 if not set. */
    time_on: number;
    /** Time to switch lights off, seconds after midnight. -1 if not set. */
    time_off: number;
}
export interface coordinate {
    x: number;
    y: number;
    z: number;
}
export interface layout {
    source: string;
    synthesized: boolean;
    uuid: string;
    coordinates: coordinate[];
    code: applicationResponseCode;
}
//# sourceMappingURL=interfaces.d.ts.map