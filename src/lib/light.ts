import { generateRandomHex } from "./utils.js";

import axios, { AxiosInstance, AxiosResponse } from "axios";
import FetchWrapper, { FetchResponse } from "./fetchwrapper.js";
import delay from "delay";
// dynamically import udp for compatibility with browser
// import * as udp from "node:dgram";

import { Led } from "./led.js";
import { Frame } from "./frame.js";
import { Movie } from "./movie.js";

import {
  rgbColor,
  hsvColor,
  deviceMode,
  applicationResponseCode,
  timer,
  coordinate,
  layout,
} from "./interfaces.js";

// create error
let errNoToken = Error("No valid token");

/**
 * Represents a Twinkly device
 * @public
 *
 */
export class Light {
  ipaddr: string;
  challenge: string;
  net: AxiosInstance | FetchWrapper;
  token: AuthenticationToken | undefined;
  activeLoginCall: boolean;
  nleds: number | undefined;
  udpClient: any; //udp.Socket;
  /**
   * Creates an instance of Light.
   *
   * @constructor
   * @param {string} ipaddr IP Address of the Twinkly device
   */
  constructor(
    ipaddr: string,
    timeout: number = 20000,
    useFetch: boolean = false
  ) {
    this.ipaddr = ipaddr;
    this.challenge = ""; // default value, will be set in login()
    const config = {
      baseURL: `http://${this.ipaddr}/xled/v1/`,
      timeout: timeout,
    };
    if (useFetch) {
      this.net = new FetchWrapper(config.baseURL, config.timeout);
    } else {
      this.net = axios.create(config);
    }
    this.activeLoginCall = false;

    // dynamically import udp asynchroniously with IIFE
    (async () => {
      let udp;

      if (typeof window === "undefined") {
        // Handle the case for Node.js environments
        try {
          udp = await import("node:dgram");
          this.udpClient = udp.createSocket("udp4");
        } catch (error: any) {
          throw new Error("Failed to import node:dgram: " + error.message);
        }
      } else {
        // Handle the case for non-Node.js environments
        this.udpClient = null;
      }
    })();
  }
  /**
   * Sends a POST request to the device, appending the required tokens
   *
   * @param {string} url
   * @param {object} params
   */
  async sendPostRequest(
    url: string,
    data: any = {},
    contentType: string = "application/json"
  ): Promise<any> {
    if (!this.token) throw errNoToken;
    let res: AxiosResponse | FetchResponse;
    try {
      res = await this.net.post(url, data, {
        headers: {
          "Content-Type": contentType,
        },
      });
    } catch (err) {
      throw err;
    }
    if (res.data.code != applicationResponseCode.Ok) {
      throw Error(`Mode set failed with error code ${res.data.code}`);
    }
    return res.data;
  }

  /**
   * Sends a DELETE request to the device, appending the required tokens
   *
   * @param {string} url
   * @param {object} data
   */
  async sendDeleteRequest(url: string, data: any): Promise<any> {
    if (!this.token) throw errNoToken;
    let res: AxiosResponse | FetchResponse;
    try {
      res = await this.net.delete(url, data);
    } catch (err) {
      throw err;
    }
    if (res.data.code != applicationResponseCode.Ok) {
      throw Error(`Mode set failed with error code ${res.data.code}`);
    }
    return res.data;
  }

  /**
   * Sends a GET request to the device, appending the required tokens
   *
   * @param {string} url
   * @param {object} params
   */
  async sendGetRequest(
    url: string,
    params?: object,
    requiresToken: boolean = true
  ): Promise<any> {
    if (!this.token && requiresToken) throw errNoToken;
    let res: AxiosResponse | FetchResponse;
    try {
      res = await this.net.get(url, params || {});
    } catch (err) {
      throw err;
    }
    if (res.data.code != applicationResponseCode.Ok) {
      throw Error(`Request failed with error code ${res.data.code}`);
    }
    return res.data;
  }

  /**
   * Sends a login request
   *
   * @returns {*}
   */
  async login(): Promise<void> {
    this.activeLoginCall = true;
    this.autoEndLoginCall();
    let res: AxiosResponse | FetchResponse;
    this.challenge = await generateRandomHex(256);

    try {
      res = await this.net.post("/login", {
        challenge: this.challenge,
      });
    } catch (err) {
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
    } catch (err) {
      throw err;
    }
    this.activeLoginCall = false;
  }
  /**
   * Sends a logout request
   */
  async logout(): Promise<void> {
    await this.sendPostRequest("/logout");
  }
  /**
   * Automatically ends a login call after 1 second
   */
  async autoEndLoginCall(): Promise<void> {
    await delay(1000);
    if (this.activeLoginCall) {
      this.activeLoginCall = false;
      console.warn("Login call timed out");
    }
  }
  /**
   * Check that we are logged in to the device
   */
  async verify(): Promise<void> {
    let res: AxiosResponse | FetchResponse;
    if (this.token === undefined) throw errNoToken;
    try {
      res = await this.net.post("/verify", {
        "challenge-response": this.token.getChallengeResponse(),
      });
    } catch (err) {
      throw err;
    }
    if (res.data.code != applicationResponseCode.Ok) {
      throw errNoToken;
    }
  }
  /**
   * Ensure that we are logged into to the device, and if not initiate a login request
   */
  async ensureLoggedIn(): Promise<void> {
    try {
      await this.verify();
    } catch (err) {
      if (err != errNoToken) {
        throw err;
      }
      let i = 0;
      while (this.activeLoginCall && i < 5) {
        await delay(1200);
        i++;
      }
      await this.login();
    }
  }
  /**
   * Gets details about the device
   *
   * @returns {Promise<object>} Results vary, see https://xled-docs.readthedocs.io/en/latest/rest_api.html#device-details
   */
  async getDeviceDetails(): Promise<object> {
    let data = await this.sendGetRequest("/gestalt", undefined, false);
    return data;
  }
  /**
   * Turns the device off
   *
   * @returns {unknown}
   */
  async setOff(): Promise<void> {
    return this.setMode(deviceMode.off);
  }
  /**
   * Sets the state
   * @experimental
   * @param {boolean} state - Set on/off
   */
  async setState(state: boolean): Promise<void> {
    return this.setMode(state ? deviceMode.color : deviceMode.off);
  }

  /**
   * Get the name of the device
   *
   * @returns {Promise<string>} Name of device
   */
  async getName(): Promise<string> {
    let data = await this.sendGetRequest("/device_name");
    let res: string = data.name;
    return res;
  }

  /**
   * Sets the name of the device
   *
   * @param {string} name Desired device name, max 32 charachters
   * @returns {Promise<void>}
   */
  async setName(name: string): Promise<void> {
    if (name.length > 32)
      throw new Error("Name is too long - must be 32 char or less");

    await this.sendPostRequest("/led/out/brightness", {
      name: name,
    });
  }

  /**
   * Gets time when lights will turn on and off
   *
   * @returns {Promise<timer>}
   */
  async getTimer(): Promise<timer> {
    let data: timer = await this.sendGetRequest("/timer");
    return data;
  }
  /**
   * Sets the time when lights will turn on and off
   *
   * @param timer
   */
  async setTimer(timer: timer): Promise<void> {
    await this.sendPostRequest("/timer", timer);
  }
  /**
   * Sets the brightness level
   *
   * @param {number} value
   * @param {string} [mode="enabled"]
   * @param {string} [type="A"]
   * @returns {}
   */
  async setBrightness(
    value: number,
    mode: string = "enabled",
    type: string = "A"
  ): Promise<void> {
    await this.sendPostRequest("/led/out/brightness", {
      mode: mode,
      type: type,
      value: value,
    });
  }

  /**
   * Gets the current brightness level
   *
   * @returns {number} Current brightness in range 0..100
   */
  async getBrightness(): Promise<number> {
    let data = await this.sendGetRequest("/led/out/brightness", {});
    return data.value;
  }

  /**
   *
   * @returns {Promise<number>} Current saturation in range 0..100
   */
  async getSaturation(): Promise<number> {
    let data = await this.sendGetRequest("/led/out/saturation", {});
    return data.value;
  }

  /**
   * Sets the saturation level
   *
   * @param value
   * @param mode
   * @param type
   */
  async setSaturation(
    value: number,
    mode: string = "enabled",
    type: string = "A"
  ): Promise<void> {
    await this.sendPostRequest("/led/out/saturation", {
      value,
      mode,
      type,
    });
  }

  /**
   * Gets the current color in HSV
   */
  async getHSVColor(): Promise<hsvColor> {
    let data = await this.sendGetRequest("/led/color", {});
    let res: hsvColor = {
      hue: data.hue,
      saturation: data.saturation,
      value: data.value,
    };
    return res;
  }

  /**
   * Gets the current color in RGB
   */
  async getRGBColor(): Promise<rgbColor> {
    let data = await this.sendGetRequest("/led/color", {});
    let res: rgbColor = { red: data.red, green: data.green, blue: data.blue };
    return res;
  }

  /**
   * Sets the color in RGB when in color mode
   *
   * @param {rgbColor} color A RGB color
   */
  async setRGBColor(color: rgbColor): Promise<void> {
    await this.sendPostRequest("/led/color", {
      red: color.red,
      green: color.green,
      blue: color.blue,
    });
  }
  async setRGBColorRealTime(color: rgbColor): Promise<void> {
    let frame = new OneColorFrame(color, await this.getNLeds());
    await this.sendRealTimeFrame(frame);
  }

  /**
   * Sets the color in HSV when in color mode
   *
   * @param {hsvColor} color A HSV color
   */
  async setHSVColor(color: hsvColor): Promise<void> {
    await this.sendPostRequest("/led/color", {
      hue: Math.round(color.hue),
      saturation: Math.round(color.saturation),
      value: Math.round(color.value),
    });
  }

  /**
   * Gets the LED operation mode
   *
   * @returns {deviceMode} mode
   */
  async getMode(): Promise<deviceMode> {
    let res = await this.sendGetRequest("/led/mode", {});
    let mode: deviceMode = (<any>deviceMode)[res.mode];
    return mode;
  }
  /**
   * Sets the LED operation mode
   *
   * @param {deviceMode} mode
   */
  async setMode(mode: deviceMode): Promise<void> {
    await this.sendPostRequest("/led/mode", { mode: mode });
  }
  /**
   * Send a movie config to the device
   *
   * @param movie
   * @returns
   */
  async sendMovieConfig(movie: Movie) {
    let params = movie.export();
    let delay = Math.floor(1000 / params.fps);
    let number_of_leds = params.leds_per_frame;
    let number_of_frames = params.frames_number;

    let data = {
      delay,
      number_of_leds,
      number_of_frames,
    };
    let res = await this.sendPostRequest(
      "led/movie/config",
      data,
      "application/json"
    );
    return res;
  }
  /**
   * Get the movie config from the device
   *
   * @returns response from device
   */
  async getMovieConfig() {
    let res = await this.sendGetRequest("led/movie/config", {});
    return res;
  }
  /**
   * Send a movie to the device
   *
   * @param movie
   * @returns
   */
  async sendMovieToDevice(movie: Movie) {
    let res = await this.sendPostRequest(
      "led/movie/full",
      movie.toOctet(),
      "application/octet-stream"
    );
    return res;
  }
  /**
   * Send a realtime frame to device
   *
   * @param frame
   * @returns
   */
  async sendRealTimeFrame(frame: Frame) {
    let res = await this.sendPostRequest(
      "led/rt/frame",
      frame.toOctet(),
      "application/octet-stream"
    );
    return res;
  }
  /**
   * Send a realtime frame to device via UDP
   * WARNING: This only works with nodejs
   *
   * @param frame
   */
  async sendRealTimeFrameUDP(frame: Frame) {
    if (!this.token) throw errNoToken;

    if (!this.udpClient) throw new Error("UDP not supported in browser");

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
    this.udpClient.send(data, 7777, this.ipaddr, (error: any) => {
      if (error) {
        console.warn(error);
      }
    });
  }
  /**
   * Get a list of movies
   *
   * @returns {Promise<Movie[]>}
   */
  async getListOfMovies(): Promise<Movie[]> {
    let res = await this.sendGetRequest("/movies", {});
    let movies: Movie[] = res.movies.map((data: any) => {
      return new Movie(data);
    });
    return movies;
  }
  /**
   * Add a movie to the device
   *
   * @param movie
   * @returns response from device
   */
  async addMovie(movie: Movie) {
    await this.sendPostRequest("/movies/new", movie.export());
    let res = await this.sendPostRequest(
      "/movies/full",
      movie.toOctet(),
      "application/octet-stream"
    );
    return res;
  }
  /**
   *
   * @returns response from device
   */
  async deleteMovies() {
    let res = await this.sendDeleteRequest("/movies", {});
    return res;
  }
  /**
   * Get the current layout of the LEDs
   *
   * @returns {Promise<layout>} Layout of LEDs
   */
  async getLayout(): Promise<layout> {
    let res: layout = await this.sendGetRequest("/led/layout/full", {});
    return res;
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
  async uploadLayout(
    coordinates: coordinate[],
    source: string = "3D",
    synthesized: boolean = false,
    aspectXY: number = 0,
    aspectXZ: number = 0
  ) {
    let res = await this.sendPostRequest("/led/layout/full", {
      coordinates,
      source,
      synthesized,
      aspectXY,
      aspectXZ,
    });
    return res;
  }
  /**
   * Get the number of LEDs in the device
   *
   * @returns number of LEDs in the device
   */
  async getNLeds(): Promise<number> {
    if (this.nleds) return this.nleds;
    let res: any = await this.getDeviceDetails();
    let nleds: number = res.number_of_led;
    this.nleds = nleds;
    return nleds;
  }
  /**
   * Get the current MQTT config
   *
   * @returns MQTT config
   */
  async getMqttConfig(): Promise<object> {
    let res = await this.sendGetRequest("/mqtt/config", {});
    return res;
  }
  /**
   * Set the MQTT config
   *
   * @param config
   * @returns response from device
   */
  async setMqttConfig(config: object): Promise<object> {
    let res = await this.sendPostRequest("/mqtt/config", config);
    return res;
  }
  /**
   * Get the current playlist
   *
   * @returns response from device
   */
  async getPlaylist(): Promise<object> {
    let res = await this.sendGetRequest("/playlist", {});
    return res;
  }
  /**
   * Create a new playlist
   *
   * @param playlist
   * @returns response from device
   */
  async createPlaylist(playlist: object): Promise<object> {
    let res = await this.sendPostRequest("/playlist", playlist);
    return res;
  }
  /**
   * Get device summary
   *
   * @returns response from device
   */
  async getSummary() {
    let res = await this.sendGetRequest("/summary", {});
    return res;
  }
  /**
   * Get the current movie
   *
   * @returns response from device
   */
  async getCurrentMovie(): Promise<object> {
    let res = await this.sendGetRequest("/movie/current", {});
    return res;
  }
  /**
   * Set the current movie
   *
   * @param id
   * @returns response from device
   */
  async setCurrentMovie(id: number): Promise<object> {
    // id must be between 0 and 15
    if (id < 0 || id > 15) throw new Error("ID must be between 0 and 15");
    let res = await this.sendPostRequest("/movies/current", id);
    return res;
  }
  /**
   * Get network status
   *
   * @returns response from device
   */
  async getNetworkStatus(): Promise<object> {
    let res = await this.sendGetRequest("/network/status", {});
    return res;
  }
  /**
   * Set network status
   *
   * @param status
   * @returns
   */
  async setNetworkStatus(status: object): Promise<object> {
    let res = await this.sendPostRequest("/network/status", status);
    return res;
  }
}

/**
 * Represents an authentication token used to login to an xled instance
 * @internal
 */
export class AuthenticationToken {
  token: string;
  expiry: Date;
  challengeResponse: string;

  /**
   * Creates an instance of AuthenticationToken.
   *
   * @constructor
   * @param {AxiosResponse | FetchResponse} res Response from POST request
   */
  constructor(res: AxiosResponse | FetchResponse) {
    this.token = res.data.authentication_token;
    this.expiry = new Date(
      Date.now() + res.data.authentication_token_expires_in * 1000
    );
    this.challengeResponse = res.data.challenge_response;
  }
  /**
   *
   * @returns Token as string
   */
  getToken(): string {
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
  getChallengeResponse(): string {
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
  constructor(rgb: rgbColor, nleds: number) {
    let leds: Led[] = Array(nleds).fill(new Led(rgb.red, rgb.green, rgb.blue));
    super(leds);
  }
}
