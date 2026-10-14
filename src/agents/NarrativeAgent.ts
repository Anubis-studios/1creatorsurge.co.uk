import { CONFIG } from "../config";
import { postJSON } from "../utils/http";

export interface NarrativeRequest {
  topic: string;
  style?: string;
  format?: string;
}

export interface NarrativeResponse {
  blocks: string[]; // text blocks for infographic
}

export class NarrativeAgent {
  async generate(req: NarrativeRequest): Promise<NarrativeResponse> {
    const style = req.style ?? "advertising + educational";
    const format = req.format ?? "infographic text blocks";

    const prompt = `
You are an advertising copywriter and educator.
Topic: ${req.topic}
Style: ${style}
Format: ${format}
Write 8–12 short, punchy text blocks suitable for an infographic and a 60-second ad.
`;

    const result = await postJSON<NarrativeResponse>(
      CONFIG.FREELLMENDPOINT,
      { prompt }
    );

    return result;
  }
}
