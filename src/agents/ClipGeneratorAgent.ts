import { CONFIG } from "../config";
import { postJSON } from "../utils/http";

export interface ClipGeneratorInput {
  prompt: string;
  lengthSeconds?: number;
}

export interface ClipGeneratorOutput {
  clipPath: string; // file path or URL
}

export class ClipGeneratorAgent {
  async generate(input: ClipGeneratorInput): Promise<ClipGeneratorOutput> {
    const length = input.lengthSeconds ?? CONFIG.CLIPLENGTHSECONDS;

    const payload = {
      prompt: input.prompt,
      length_seconds: length,
      style: CONFIG.STYLE
    };

    const result = await postJSON<ClipGeneratorOutput>(
      CONFIG.FREEVIDEOENDPOINT,
      payload
    );

    return result;
  }
}
