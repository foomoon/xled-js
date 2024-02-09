import { Frame } from "./frame.js";

export class Movie {
  id: number;
  name: string;
  unique_id: string;
  descriptor_type: string;
  loop_type: number;
  leds_per_frame: number;
  frames_number: number;
  fps: number;
  frameData: Frame[];
  constructor(data: any) {
    // Required for toOctet()
    this.frameData = data.frames || null;

    // Check if all frames are the same length
    if (this.frameData != null) {
      let leds_per_frame = 0;
      this.frameData.forEach((frame) => {
        if (frame.getNLeds() != leds_per_frame && leds_per_frame != 0)
          throw new Error("Frames must all be the same length");
        leds_per_frame = frame.getNLeds();
      });
    }

    // Required for export()
    this.name = data.name || "xled-js effect";
    this.unique_id = data.unique_id || generateUUID();
    this.descriptor_type = data.descriptor_type || "rgb_raw";
    this.leds_per_frame = data.leds_per_frame || this.frameData[0].getNLeds();
    this.frames_number = data.frames_number || this.frameData.length;
    this.fps = data.fps || 0;

    // Not used yet
    this.id = data.id || 0;
    this.loop_type = data.loop_type || 0;
  }
  export() {
    return {
      // id: this.id,
      name: this.name,
      unique_id: this.unique_id,
      descriptor_type: this.descriptor_type,
      leds_per_frame: this.leds_per_frame,
      loop_type: this.loop_type,
      frames_number: this.frames_number,
      fps: this.fps,
    };
  }
  toOctet(): Uint8Array {
    const frames = this.frameData;
    this.frames_number = frames.length;
    this.leds_per_frame = frames[0].getNLeds();
    const buffer = new ArrayBuffer(
      this.frames_number * this.leds_per_frame * 3
    );
    const output = new Uint8Array(buffer);
    frames.forEach((frame, index) => {
      if (frame.getNLeds() != this.leds_per_frame)
        throw new Error("Frames must all be the same length");

      // convert to octet
      let octet = frame.toOctet();

      // add octet to output
      let offset = index * this.leds_per_frame * 3;
      output.set(octet, offset);
    });
    // this.frameData = output;
    return output; //.buffer;
  }
  fromOctet(octet: Uint8Array) {
    const nFrames = this.frames_number;
    const nLeds = this.leds_per_frame;
    const nBytes = nFrames * nLeds * 3;
    if (octet.length != nBytes)
      throw new Error(
        `Octet length (${octet.length}) does not match expected length (${nBytes})`
      );

    const frames = [];
    for (let i = 0; i < nFrames; i++) {
      const offset = i * nLeds * 3;
      const frameOctet = octet.slice(offset, offset + nLeds * 3);
      const frame = new Frame([]);
      frame.fromOctet(frameOctet);
      frames.push(frame);
    }
    this.frameData = frames;
  }
  size(isCompressed: boolean = false) {
    let nBytes = 0;
    // for each frame, determine number of leds
    this.frameData.forEach((frame) => {
      let leds = frame.leds;
      if (isCompressed) {
        leds = frame.leds.filter((led) => {
          return led.red != 0 && led.green != 0 && led.blue != 0;
        });
      }
      let numNonBlackLeds = leds.length;
      nBytes += numNonBlackLeds * 3;
    });
    return nBytes;
  }
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
