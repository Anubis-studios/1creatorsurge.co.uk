import { CONFIG } from "../config";
import { postJSON } from "../utils/http";

export interface ClaymationImageRequest {
  topic: string;
  style?: string;
  count?: number;
}

export interface ClaymationImageResponse {
  images: string[]; // file paths or URLs
}

export class ClaymationImageAgent {
  async generate(req: ClaymationImageRequest): Promise<ClaymationImageResponse> {
    const style = req.style ?? CONFIG.STYLE;
    const count = req.count ?? 12;

    const payload = {
      prompt: `Claymation-style infographic frames explaining: ${req.topic}`,
      style,
      count
    };

    const result = await postJSON<ClaymationImageResponse>(
      CONFIG.FREEIMAGEENDPOINT,
      payload
    );

    return result;
  }
}
