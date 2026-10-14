import { CONFIG } from "../config";
import { postJSON } from "../utils/http";

export interface VideoStitchInput {
  clips: string[];
  finalLengthSeconds?: number;
}

export interface VideoStitchOutput {
  finalVideoPath: string;
}

export class VideoStitchAgent {
  async stitch(input: VideoStitchInput): Promise<VideoStitchOutput> {
    const finalLength = input.finalLengthSeconds ?? CONFIG.TOTALVIDEOLENGTH_SECONDS;

    const payload = {
      clips: input.clips,
      targetlengthseconds: finalLength
    };

    const result = await postJSON<VideoStitchOutput>(
      CONFIG.VIDEOSTITCHENDPOINT,
      payload
    );

    return result;
  }
}
