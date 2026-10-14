import { CONFIG } from "../config";
import { ClaymationImageAgent } from "../agents/ClaymationImageAgent";
import { NarrativeAgent } from "../agents/NarrativeAgent";
import { InfographicBuilderAgent } from "../agents/InfographicBuilderAgent";
import { PromptEngineerAgent } from "../agents/PromptEngineerAgent";
import { ClipGeneratorAgent } from "../agents/ClipGeneratorAgent";
import { VideoStitchAgent } from "../agents/VideoStitchAgent";
import { OutputAgent } from "../agents/OutputAgent";

export interface RunOptions {
  topic: string;
}

export async function runClaymationAdWorkflow(opts: RunOptions) {
  const { topic } = opts;

  const imageAgent = new ClaymationImageAgent();
  const narrativeAgent = new NarrativeAgent();
  const infographicBuilder = new InfographicBuilderAgent();
  const promptEngineer = new PromptEngineerAgent();
  const clipGenerator = new ClipGeneratorAgent();
  const videoStitcher = new VideoStitchAgent();
  const outputAgent = new OutputAgent();

  // 1. Images
  const imagesRes = await imageAgent.generate({ topic });
  // 2. Text
  const textRes = await narrativeAgent.generate({ topic });
  // 3. Panels
  const panelsRes = await infographicBuilder.build({
    images: imagesRes.images,
    textBlocks: textRes.blocks
  });
  // 4. Clip prompts
  const promptsRes = await promptEngineer.generate({
    topic,
    panels: panelsRes.panels,
    segments: CONFIG.SEGMENT_COUNT,
    segmentLength: CONFIG.CLIPLENGTHSECONDS
  });

  // 5. Generate clips (8 x 8s)
  const clipPaths: string[] = [];
  for (const prompt of promptsRes.clipPrompts) {
    const clip = await clipGenerator.generate({
      prompt,
      lengthSeconds: CONFIG.CLIPLENGTHSECONDS
    });
    clipPaths.push(clip.clipPath);
  }

  // 6. Stitch final video
  const stitched = await videoStitcher.stitch({
    clips: clipPaths,
    finalLengthSeconds: CONFIG.TOTALVIDEOLENGTH_SECONDS
  });

  // 7. Deliver
  const delivered = await outputAgent.deliver({
    videoPath: stitched.finalVideoPath,
    topic,
    clipCount: CONFIG.SEGMENT_COUNT,
    clipLengthSeconds: CONFIG.CLIPLENGTHSECONDS
  });

  return delivered;
}
