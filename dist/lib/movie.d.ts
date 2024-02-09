import { Frame } from "./frame.js";
export declare class Movie {
    id: number;
    name: string;
    unique_id: string;
    descriptor_type: string;
    loop_type: number;
    leds_per_frame: number;
    frames_number: number;
    fps: number;
    frameData: Frame[];
    constructor(data: any);
    export(): {
        name: string;
        unique_id: string;
        descriptor_type: string;
        leds_per_frame: number;
        loop_type: number;
        frames_number: number;
        fps: number;
    };
    toOctet(): Uint8Array;
    fromOctet(octet: Uint8Array): void;
    size(isCompressed?: boolean): number;
}
