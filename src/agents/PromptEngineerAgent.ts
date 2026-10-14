import { CONFIG } from "../config";
import { postJSON } from "../utils/http";
import { InfographicPanel } from "./InfographicBuilderAgent";

export interface PromptEngineerInput {
  topic: string;
  panels: InfographicPanel[];
  segments?: number;
  segmentLength?: number;
}

export interface PromptEngineerOutput {
  clipPrompts: string[];
}

export class PromptEngineerAgent {
  async generate(input: PromptEngineerInput): Promise<PromptEngineerOutput> {
    const segments = input.segments ?? CONFIG.SEGMENT_COUNT;
    const segmentLength = input.segmentLength ?? CONFIG.CLIPLENGTHSECONDS;

    const prompt = `
You are a video prompt engineer.
Topic: ${input.topic}
We have infographic panels (image + text). Create ${segments} distinct prompts.
Each prompt must describe an ${segmentLength}-second claymation-style video segment
that visually and narratively matches the infographic content and flows logically
from start to finish as a 60-second advertisement.

Return them as a numbered list of prompts only.
Panels summary:
${input.panels.map((p, i) => `Panel ${i + 1}: ${p.text}`).join("\n")}
`;

    const result = await postJSON<{ prompts: string[] }>(
      CONFIG.FREELLMENDPOINT,
      { prompt }
    );

    return { clipPrompts: result.prompts };
  }
}
