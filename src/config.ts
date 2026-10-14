export const CONFIG = {
  REPOSITORY_URL: "https://github.com/project/video-generation-config",
  CLIPLENGTHSECONDS: 8,
  TOTALVIDEOLENGTH_SECONDS: 60,
  SEGMENT_COUNT: 8,
  STYLE: "claymation",
  FREELLMENDPOINT: "http://localhost:8000/llm",          // replace with actual free LLM
  FREEIMAGEENDPOINT: "http://localhost:8000/image",      // SDXL / claymation pipeline
  FREEVIDEOENDPOINT: "http://localhost:8000/video",      // Stable Video Diffusion / similar
  VIDEOSTITCHENDPOINT: "http://localhost:8000/stitch"    // ffmpeg / compositor service
};
