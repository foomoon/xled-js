var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { generateRandomHex } from "./utils.js";
import axios from "axios";
import FetchWrapper from "./fetchwrapper.js";
import delay from "delay";
// dynamically import udp for compatibility with browser
// import * as udp from "node:dgram";
import { Led } from "./led.js";
import { Frame } from "./frame.js";
import { Movie } from "./movie.js";
import { deviceMode, applicationResponseCode, } from "./interfaces.js";
// create error
let errNoToken = Error("No valid token");
/**
 * Represents a Twinkly device
 * @public
 *
 */
export class Light {
    /**
     * Creates an instance of Light.
     *
     * @constructor
     * @param {string} ipaddr IP Address of the Twinkly device
     */
    constructor(ipaddr, timeout = 20000, useFetch = false) {
        this.ipaddr = ipaddr;
        this.challenge = ""; // default value, will be set in login()
        const config = {
            baseURL: `http://${this.ipaddr}/xled/v1/`,
            timeout: timeout,
        };
        if (useFetch) {
            this.net = new FetchWrapper(config.baseURL, config.timeout);
        }
        else {
            this.net = axios.create(config);
        }
        this.activeLoginCall = false;
        // dynamically import udp asynchroniously with IIFE
        (() => __awaiter(this, void 0, void 0, function* () {
            let udp;
            if (typeof window === "undefined") {
                // Handle the case for Node.js environments
                try {
                    udp = yield import("node:dgram");
                    this.udpClient = udp.createSocket("udp4");
                }
                catch (error) {
                    throw new Error("Failed to import node:dgram: " + error.message);
                }
            }
            else {
                // Handle the case for non-Node.js environments
                this.udpClient = null;
            }
        }))();
    }
    /**
     * Sends a POST request to the device, appending the required tokens
     *
     * @param {string} url
     * @param {object} params
     */
    sendPostRequest(url, data = {}, contentType = "application/json") {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.token)
                throw errNoToken;
            let res;
            try {
                res = yield this.net.post(url, data, {
                    headers: {
                        "Content-Type": contentType,
                    },
                });
            }
            catch (err) {
                throw err;
            }
            if (res.data.code != applicationResponseCode.Ok) {
                throw Error(`Mode set failed with error code ${res.data.code}`);
            }
            return res.data;
        });
    }
    /**
     * Sends a DELETE request to the device, appending the required tokens
     *
     * @param {string} url
     * @param {object} data
     */
    sendDeleteRequest(url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.token)
                throw errNoToken;
            let res;
            try {
                res = yield this.net.delete(url, data);
            }
            catch (err) {
                throw err;
            }
            if (res.data.code != applicationResponseCode.Ok) {
                throw Error(`Mode set failed with error code ${res.data.code}`);
            }
            return res.data;
        });
    }
    /**
     * Sends a GET request to the device, appending the required tokens
     *
     * @param {string} url
     * @param {object} params
     */
    sendGetRequest(url, params, requiresToken = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.token && requiresToken)
                throw errNoToken;
            let res;
            try {
                res = yield this.net.get(url, params || {});
            }
            catch (err) {
                throw err;
            }
            if (res.data.code != applicationResponseCode.Ok) {
                throw Error(`Request failed with error code ${res.data.code}`);
            }
            return res.data;
        });
    }
    /**
     * Sends a login request
     *
     * @returns {*}
     */
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            this.activeLoginCall = true;
            this.autoEndLoginCall();
            let res;
            this.challenge = yield generateRandomHex(256);
            try {
                res = yield this.net.post("/login", {
                    challenge: this.challenge,
                });
            }
            catch (err) {
                throw err;
            }
            this.token = new AuthenticationToken(res);
            this.net.defaults.headers["X-Auth-Token"] = this.token.getToken();
            if (res.data.code != applicationResponseCode.Ok) {
                throw Error("Login request failed");
            }
            console.log("Login request successful");
            try {
                this.verify();
            }
            catch (err) {
                throw err;
            }
            this.activeLoginCall = false;
        });
    }
    /**
     * Sends a logout request
     */
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendPostRequest("/logout");
        });
    }
    /**
     * Automatically ends a login call after 1 second
     */
    autoEndLoginCall() {
        return __awaiter(this, void 0, void 0, function* () {
            yield delay(1000);
            if (this.activeLoginCall) {
                this.activeLoginCall = false;
                console.warn("Login call timed out");
            }
        });
    }
    /**
     * Check that we are logged in to the device
     */
    verify() {
        return __awaiter(this, void 0, void 0, function* () {
            let res;
            if (this.token === undefined)
                throw errNoToken;
            try {
                res = yield this.net.post("/verify", {
                    "challenge-response": this.token.getChallengeResponse(),
                });
            }
            catch (err) {
                throw err;
            }
            if (res.data.code != applicationResponseCode.Ok) {
                throw errNoToken;
            }
        });
    }
    /**
     * Ensure that we are logged into to the device, and if not initiate a login request
     */
    ensureLoggedIn() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.verify();
            }
            catch (err) {
                if (err != errNoToken) {
                    throw err;
                }
                let i = 0;
                while (this.activeLoginCall && i < 5) {
                    yield delay(1200);
                    i++;
                }
                yield this.login();
            }
        });
    }
    /**
     * Gets details about the device
     *
     * @returns {Promise<object>} Results vary, see https://xled-docs.readthedocs.io/en/latest/rest_api.html#device-details
     */
    getDeviceDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.sendGetRequest("/gestalt", undefined, false);
            return data;
        });
    }
    /**
     * Turns the device off
     *
     * @returns {unknown}
     */
    setOff() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setMode(deviceMode.off);
        });
    }
    /**
     * Sets the state
     * @experimental
     * @param {boolean} state - Set on/off
     */
    setState(state) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setMode(state ? deviceMode.color : deviceMode.off);
        });
    }
    /**
     * Get the name of the device
     *
     * @returns {Promise<string>} Name of device
     */
    getName() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.sendGetRequest("/device_name");
            let res = data.name;
            return res;
        });
    }
    /**
     * Sets the name of the device
     *
     * @param {string} name Desired device name, max 32 charachters
     * @returns {Promise<void>}
     */
    setName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name.length > 32)
                throw new Error("Name is too long - must be 32 char or less");
            yield this.sendPostRequest("/led/out/brightness", {
                name: name,
            });
        });
    }
    /**
     * Gets time when lights will turn on and off
     *
     * @returns {Promise<timer>}
     */
    getTimer() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.sendGetRequest("/timer");
            return data;
        });
    }
    /**
     * Sets the time when lights will turn on and off
     *
     * @param timer
     */
    setTimer(timer) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendPostRequest("/timer", timer);
        });
    }
    /**
     * Sets the brightness level
     *
     * @param {number} value
     * @param {string} [mode="enabled"]
     * @param {string} [type="A"]
     * @returns {}
     */
    setBrightness(value, mode = "enabled", type = "A") {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendPostRequest("/led/out/brightness", {
                mode: mode,
                type: type,
                value: value,
            });
        });
    }
    /**
     * Gets the current brightness level
     *
     * @returns {number} Current brightness in range 0..100
     */
    getBrightness() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.sendGetRequest("/led/out/brightness", {});
            return data.value;
        });
    }
    /**
     *
     * @returns {Promise<number>} Current saturation in range 0..100
     */
    getSaturation() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.sendGetRequest("/led/out/saturation", {});
            return data.value;
        });
    }
    /**
     * Sets the saturation level
     *
     * @param value
     * @param mode
     * @param type
     */
    setSaturation(value, mode = "enabled", type = "A") {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendPostRequest("/led/out/saturation", {
                value,
                mode,
                type,
            });
        });
    }
    /**
     * Gets the current color in HSV
     */
    getHSVColor() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.sendGetRequest("/led/color", {});
            let res = {
                hue: data.hue,
                saturation: data.saturation,
                value: data.value,
            };
            return res;
        });
    }
    /**
     * Gets the current color in RGB
     */
    getRGBColor() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.sendGetRequest("/led/color", {});
            let res = { red: data.red, green: data.green, blue: data.blue };
            return res;
        });
    }
    /**
     * Sets the color in RGB when in color mode
     *
     * @param {rgbColor} color A RGB color
     */
    setRGBColor(color) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendPostRequest("/led/color", {
                red: color.red,
                green: color.green,
                blue: color.blue,
            });
        });
    }
    setRGBColorRealTime(color) {
        return __awaiter(this, void 0, void 0, function* () {
            let frame = new OneColorFrame(color, yield this.getNLeds());
            yield this.sendRealTimeFrame(frame);
        });
    }
    /**
     * Sets the color in HSV when in color mode
     *
     * @param {hsvColor} color A HSV color
     */
    setHSVColor(color) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendPostRequest("/led/color", {
                hue: Math.round(color.hue),
                saturation: Math.round(color.saturation),
                value: Math.round(color.value),
            });
        });
    }
    /**
     * Gets the LED operation mode
     *
     * @returns {deviceMode} mode
     */
    getMode() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/led/mode", {});
            let mode = deviceMode[res.mode];
            return mode;
        });
    }
    /**
     * Sets the LED operation mode
     *
     * @param {deviceMode} mode
     */
    setMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendPostRequest("/led/mode", { mode: mode });
        });
    }
    /**
     * Send a movie config to the device
     *
     * @param movie
     * @returns
     */
    sendMovieConfig(movie) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = movie.export();
            let delay = Math.floor(1000 / params.fps);
            let number_of_leds = params.leds_per_frame;
            let number_of_frames = params.frames_number;
            let data = {
                delay,
                number_of_leds,
                number_of_frames,
            };
            let res = yield this.sendPostRequest("led/movie/config", data, "application/json");
            return res;
        });
    }
    /**
     * Get the movie config from the device
     *
     * @returns response from device
     */
    getMovieConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("led/movie/config", {});
            return res;
        });
    }
    /**
     * Send a movie to the device
     *
     * @param movie
     * @returns
     */
    sendMovieToDevice(movie) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendPostRequest("led/movie/full", movie.toOctet(), "application/octet-stream");
            return res;
        });
    }
    /**
     * Send a realtime frame to device
     *
     * @param frame
     * @returns
     */
    sendRealTimeFrame(frame) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendPostRequest("led/rt/frame", frame.toOctet(), "application/octet-stream");
            return res;
        });
    }
    /**
     * Send a realtime frame to device via UDP
     * WARNING: This only works with nodejs
     *
     * @param frame
     */
    sendRealTimeFrameUDP(frame) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.token)
                throw errNoToken;
            if (!this.udpClient)
                throw new Error("UDP not supported in browser");
            // Generate the header
            let tokenArray = this.token.getTokenDecoded();
            let udpHeader = Buffer.alloc(tokenArray.length + 4);
            udpHeader.writeUInt8(0x03); // the version number
            udpHeader.fill(tokenArray, 1); // the actual token, 8 bytes
            udpHeader.writeUInt8(0x00, tokenArray.length + 1); // zero blanking
            udpHeader.writeUInt8(0x00, tokenArray.length + 2); // zero blanking
            udpHeader.writeUInt8(0x00, tokenArray.length + 3); // number of packets (currently only 1 as i only hav 250 leds)
            // Generate the body
            const data = Buffer.alloc(udpHeader.length + frame.getNLeds() * 3);
            data.fill(udpHeader);
            data.fill(frame.toOctet(), udpHeader.length);
            this.udpClient.send(data, 7777, this.ipaddr, (error) => {
                if (error) {
                    console.warn(error);
                }
            });
        });
    }
    /**
     * Get a list of movies
     *
     * @returns {Promise<Movie[]>}
     */
    getListOfMovies() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/movies", {});
            let movies = res.movies.map((data) => {
                return new Movie(data);
            });
            return movies;
        });
    }
    /**
     * Add a movie to the device
     *
     * @param movie
     * @returns response from device
     */
    addMovie(movie) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendPostRequest("/movies/new", movie.export());
            let res = yield this.sendPostRequest("/movies/full", movie.toOctet(), "application/octet-stream");
            return res;
        });
    }
    /**
     *
     * @returns response from device
     */
    deleteMovies() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendDeleteRequest("/movies", {});
            return res;
        });
    }
    /**
     * Get the current layout of the LEDs
     *
     * @returns {Promise<layout>} Layout of LEDs
     */
    getLayout() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/led/layout/full", {});
            return res;
        });
    }
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
    uploadLayout(coordinates, source = "3D", synthesized = false, aspectXY = 0, aspectXZ = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendPostRequest("/led/layout/full", {
                coordinates,
                source,
                synthesized,
                aspectXY,
                aspectXZ,
            });
            return res;
        });
    }
    /**
     * Get the number of LEDs in the device
     *
     * @returns number of LEDs in the device
     */
    getNLeds() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.nleds)
                return this.nleds;
            let res = yield this.getDeviceDetails();
            let nleds = res.number_of_led;
            this.nleds = nleds;
            return nleds;
        });
    }
    /**
     * Get the current MQTT config
     *
     * @returns MQTT config
     */
    getMqttConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/mqtt/config", {});
            return res;
        });
    }
    /**
     * Set the MQTT config
     *
     * @param config
     * @returns response from device
     */
    setMqttConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendPostRequest("/mqtt/config", config);
            return res;
        });
    }
    /**
     * Get the current playlist
     *
     * @returns response from device
     */
    getPlaylist() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/playlist", {});
            return res;
        });
    }
    /**
     * Create a new playlist
     *
     * @param playlist
     * @returns response from device
     */
    createPlaylist(playlist) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendPostRequest("/playlist", playlist);
            return res;
        });
    }
    /**
     * Get device summary
     *
     * @returns response from device
     */
    getSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/summary", {});
            return res;
        });
    }
    /**
     * Get the current movie
     *
     * @returns response from device
     */
    getCurrentMovie() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/movies/current", {});
            return res;
        });
    }
    /**
     * Set the current movie
     *
     * @param id
     * @returns response from device
     */
    setCurrentMovie(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // id must be between 0 and 15
            if (id < 0 || id > 15)
                throw new Error("ID must be between 0 and 15");
            let res = yield this.sendPostRequest("/movies/current", { id });
            return res;
        });
    }
    /**
     * Get network status
     *
     * @returns response from device
     */
    getNetworkStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/network/status", {});
            return res;
        });
    }
    /**
     * Set network status
     *
     * @param status
     * @returns
     */
    setNetworkStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendPostRequest("/network/status", status);
            return res;
        });
    }
    /**
     *
     * @returns
     */
    scanWifi() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/network/scan", {});
            return res;
        });
    }
    /**
     *
     * @returns
     */
    getWifiResults() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.sendGetRequest("/network/scan_results", {});
            return res;
        });
    }
}
/**
 * Represents an authentication token used to login to an xled instance
 * @internal
 */
export class AuthenticationToken {
    /**
     * Creates an instance of AuthenticationToken.
     *
     * @constructor
     * @param {AxiosResponse | FetchResponse} res Response from POST request
     */
    constructor(res) {
        this.token = res.data.authentication_token;
        this.expiry = new Date(Date.now() + res.data.authentication_token_expires_in * 1000);
        this.challengeResponse = res.data.challenge_response;
    }
    /**
     *
     * @returns Token as string
     */
    getToken() {
        return this.token;
    }
    /**
     *
     * @returns Token as buffer, for UDP use
     */
    getTokenDecoded() {
        return Buffer.from(this.getToken(), "base64");
    }
    /**
     *
     * @returns Challenge response generated by the XLED instance
     */
    getChallengeResponse() {
        return this.challengeResponse;
    }
}
/**
 * Easy way to create an entire frame of one color
 *
 * @export
 * @class OneColorFrame
 * @typedef {OneColorFrame}
 * @extends {Frame}
 */
export class OneColorFrame extends Frame {
    /**
     * Creates an instance of OneColorFrame.
     *
     * @constructor
     * @param {rgbColor} rgb
     * @param {number} nleds Number of LEDs to include in this frame (probably the number of LEDs in the string)
     */
    constructor(rgb, nleds) {
        let leds = Array(nleds).fill(new Led(rgb.red, rgb.green, rgb.blue));
        super(leds);
    }
}
