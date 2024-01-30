import type { Frame } from "./frame";
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
    private _channels;
    constructor(data: Record<string, any>);
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
    size(isCompressed?: boolean): number;
}
//# sourceMappingURL=movie.d.ts.map