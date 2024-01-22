/**
 * Represents the details of a discovered Twinkly device.
 */
export interface TwinklyDevice {
    ip: string;
    deviceId: string;
    code: string;
}
/**
 * Discovers Twinkly devices on the network and returns a Promise with the discovered devices.
 *
 * This function sends a UDP broadcast message to discover Twinkly devices.
 * After the discovery process is complete, it resolves the Promise with a set of the discovered devices.
 *
 * @param {number} timeout - The duration for the discovery process (in milliseconds).
 * @returns {Promise<Map<string, TwinklyDevice>>} - A Promise that resolves with a map of discovered devices.
 */
export declare function discoverTwinklyDevices(timeout?: number): Promise<Map<string, TwinklyDevice>>;
/**
 * Example to handle a set of discovered Twinkly devices
 *
 * @param device The discovered Twinkly device.
 */
export declare function handleDiscoveredDevices(): Promise<void>;
//# sourceMappingURL=discovery.d.ts.map