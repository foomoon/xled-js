/// <reference types="node" />
import { AxiosInstance, AxiosResponse } from "axios";
import FetchWrapper, { FetchResponse } from "./fetchwrapper.js";
import { Frame } from "./frame.js";
import { Movie } from "./movie.js";
import { rgbColor, hsvColor, deviceMode, timer, coordinate, layout } from "./interfaces.js";
/**
 * Represents a Twinkly device
 * @public
 *
 */
export declare class Light {
    ipaddr: string;
    challenge: string;
    net: AxiosInstance | FetchWrapper;
    token: AuthenticationToken | undefined;
    activeLoginCall: boolean;
    nleds: number | undefined;
    udpClient: any;
    /**
     * Creates an instance of Light.
     *
     * @constructor
     * @param {string} ipaddr IP Address of the Twinkly device
     */
    constructor(ipaddr: string, timeout?: number, useFetch?: boolean);
    /**
     * Sends a POST request to the device, appending the required tokens
     *
     * @param {string} url
     * @param {object} params
     */
    sendPostRequest(url: string, data?: any, contentType?: string): Promise<any>;
    /**
     * Sends a DELETE request to the device, appending the required tokens
     *
     * @param {string} url
     * @param {object} data
     */
    sendDeleteRequest(url: string, data: any): Promise<any>;
    /**
     * Sends a GET request to the device, appending the required tokens
     *
     * @param {string} url
     * @param {object} params
     */
    sendGetRequest(url: string, params?: object, requiresToken?: boolean): Promise<any>;
    /**
     * Sends a login request
     *
     * @returns {*}
     */
    login(): Promise<void>;
    /**
     * Sends a logout request
     */
    logout(): Promise<void>;
    /**
     * Automatically ends a login call after 1 second
     */
    autoEndLoginCall(): Promise<void>;
    /**
     * Check that we are logged in to the device
     */
    verify(): Promise<void>;
    /**
     * Ensure that we are logged into to the device, and if not initiate a login request
     */
    ensureLoggedIn(): Promise<void>;
    /**
     * Gets details about the device
     *
     * @returns {Promise<object>} Results vary, see https://xled-docs.readthedocs.io/en/latest/rest_api.html#device-details
     */
    getDeviceDetails(): Promise<object>;
    /**
     * Turns the device off
     *
     * @returns {unknown}
     */
    setOff(): Promise<void>;
    /**
     * Sets the state
     * @experimental
     * @param {boolean} state - Set on/off
     */
    setState(state: boolean): Promise<void>;
    /**
     * Get the name of the device
     *
     * @returns {Promise<string>} Name of device
     */
    getName(): Promise<string>;
    /**
     * Sets the name of the device
     *
     * @param {string} name Desired device name, max 32 charachters
     * @returns {Promise<void>}
     */
    setName(name: string): Promise<void>;
    /**
     * Gets time when lights will turn on and off
     *
     * @returns {Promise<timer>}
     */
    getTimer(): Promise<timer>;
    /**
     * Sets the time when lights will turn on and off
     *
     * @param timer
     */
    setTimer(timer: timer): Promise<void>;
    /**
     * Sets the brightness level
     *
     * @param {number} value
     * @param {string} [mode="enabled"]
     * @param {string} [type="A"]
     * @returns {}
     */
    setBrightness(value: number, mode?: string, type?: string): Promise<void>;
    /**
     * Gets the current brightness level
     *
     * @returns {number} Current brightness in range 0..100
     */
    getBrightness(): Promise<number>;
    /**
     *
     * @returns {Promise<number>} Current saturation in range 0..100
     */
    getSaturation(): Promise<number>;
    /**
     * Sets the saturation level
     *
     * @param value
     * @param mode
     * @param type
     */
    setSaturation(value: number, mode?: string, type?: string): Promise<void>;
    /**
     * Gets the current color in HSV
     */
    getHSVColor(): Promise<hsvColor>;
    /**
     * Gets the current color in RGB
     */
    getRGBColor(): Promise<rgbColor>;
    /**
     * Sets the color in RGB when in color mode
     *
     * @param {rgbColor} color A RGB color
     */
    setRGBColor(color: rgbColor): Promise<void>;
    setRGBColorRealTime(color: rgbColor): Promise<void>;
    /**
     * Sets the color in HSV when in color mode
     *
     * @param {hsvColor} color A HSV color
     */
    setHSVColor(color: hsvColor): Promise<void>;
    /**
     * Gets the LED operation mode
     *
     * @returns {deviceMode} mode
     */
    getMode(): Promise<deviceMode>;
    /**
     * Sets the LED operation mode
     *
     * @param {deviceMode} mode
     */
    setMode(mode: deviceMode): Promise<void>;
    /**
     * Send a movie config to the device
     *
     * @param movie
     * @returns
     */
    sendMovieConfig(movie: Movie): Promise<any>;
    /**
     * Get the movie config from the device
     *
     * @returns response from device
     */
    getMovieConfig(): Promise<any>;
    /**
     * Send a movie to the device
     *
     * @param movie
     * @returns
     */
    sendMovieToDevice(movie: Movie): Promise<any>;
    /**
     * Send a realtime frame to device
     *
     * @param frame
     * @returns
     */
    sendRealTimeFrame(frame: Frame): Promise<any>;
    /**
     * Send a realtime frame to device via UDP
     * WARNING: This only works with nodejs
     *
     * @param frame
     */
    sendRealTimeFrameUDP(frame: Frame): Promise<void>;
    /**
     * Get a list of movies
     *
     * @returns {Promise<Movie[]>}
     */
    getListOfMovies(): Promise<Movie[]>;
    /**
     * Add a movie to the device
     *
     * @param movie
     * @returns response from device
     */
    addMovie(movie: Movie): Promise<any>;
    /**
     *
     * @returns response from device
     */
    deleteMovies(): Promise<any>;
    /**
     * Get the current layout of the LEDs
     *
     * @returns {Promise<layout>} Layout of LEDs
     */
    getLayout(): Promise<layout>;
    /**
     * Upload a layout of LEDs to the device
     *
     * @param coordinates
     * @param source
     * @param synthesized
     * @param aspectXY
     * @param aspectXZ
     * @returns
     */
    uploadLayout(coordinates: coordinate[], source?: string, synthesized?: boolean, aspectXY?: number, aspectXZ?: number): Promise<any>;
    /**
     * Get the number of LEDs in the device
     *
     * @returns number of LEDs in the device
     */
    getNLeds(): Promise<number>;
    /**
     * Get the current MQTT config
     *
     * @returns MQTT config
     */
    getMqttConfig(): Promise<object>;
    /**
     * Set the MQTT config
     *
     * @param config
     * @returns response from device
     */
    setMqttConfig(config: object): Promise<object>;
    /**
     * Get the current playlist
     *
     * @returns response from device
     */
    getPlaylist(): Promise<object>;
    /**
     * Create a new playlist
     *
     * @param playlist
     * @returns response from device
     */
    createPlaylist(playlist: object): Promise<object>;
    /**
     * Get device summary
     *
     * @returns response from device
     */
    getSummary(): Promise<object>;
    /**
     * Get the current movie
     *
     * @returns response from device
     */
    getCurrentMovie(): Promise<object>;
    /**
     * Set the current movie
     *
     * @param id
     * @returns response from device
     */
    setCurrentMovie(id: number): Promise<object>;
    /**
     * Get network status
     *
     * @returns response from device
     */
    getNetworkStatus(): Promise<object>;
    /**
     * Set network status
     *
     * @param status
     * @returns
     */
    setNetworkStatus(status: object): Promise<object>;
    /**
     *
     * @returns
     */
    scanWifi(): Promise<object>;
    /**
     *
     * @returns
     */
    getWifiResults(): Promise<object>;
}
/**
 * Represents an authentication token used to login to an xled instance
 * @internal
 */
export declare class AuthenticationToken {
    token: string;
    expiry: Date;
    challengeResponse: string;
    /**
     * Creates an instance of AuthenticationToken.
     *
     * @constructor
     * @param {AxiosResponse | FetchResponse} res Response from POST request
     */
    constructor(res: AxiosResponse | FetchResponse);
    /**
     *
     * @returns Token as string
     */
    getToken(): string;
    /**
     *
     * @returns Token as buffer, for UDP use
     */
    getTokenDecoded(): Buffer;
    /**
     *
     * @returns Challenge response generated by the XLED instance
     */
    getChallengeResponse(): string;
}
/**
 * Easy way to create an entire frame of one color
 *
 * @export
 * @class OneColorFrame
 * @typedef {OneColorFrame}
 * @extends {Frame}
 */
export declare class OneColorFrame extends Frame {
    /**
     * Creates an instance of OneColorFrame.
     *
     * @constructor
     * @param {rgbColor} rgb
     * @param {number} nleds Number of LEDs to include in this frame (probably the number of LEDs in the string)
     */
    constructor(rgb: rgbColor, nleds: number);
}
