import { CONFIG } from "../config";
import { InfographicBuilderAgent } from "../agents/InfographicBuilderAgent";
import { OutputAgent } from "../agents/OutputAgent";
import { runClaymationAdWorkflow } from "../main/ClaymationInfographicAdGenerator";

async function testInfographicBuilder() {
  const builder = new InfographicBuilderAgent();
  const res = await builder.build({
    images: ["img1.jpg", "img2.jpg"],
    textBlocks: ["text1", "text2", "text3"]
  });
  if (res.panels.length !== 2) {
    throw new Error(`Expected 2 panels, got ${res.panels.length}`);
  }
  if (res.panels[0].image !== "img1.jpg" || res.panels[0].text !== "text1") {
    throw new Error("Panel 0 mismatch");
  }
  console.log("✓ InfographicBuilderAgent test passed");
}

async function testOutputAgent() {
  const outputAgent = new OutputAgent();
  const res = await outputAgent.deliver({
    videoPath: "/path/to/final.mp4",
    topic: "Recycling",
    clipCount: 8,
    clipLengthSeconds: 8
  });
  if (res.videoPath !== "/path/to/final.mp4") {
    throw new Error("Video path mismatch");
  }
  if (res.metadata.totalLengthSeconds !== 64) {
    throw new Error("Metadata totalLengthSeconds mismatch");
  }
  console.log("✓ OutputAgent test passed");
}

async function testWorkflowWithMockFetch() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    if (urlStr === CONFIG.FREEIMAGEENDPOINT) {
      return {
        ok: true,
        json: async () => ({ images: Array(8).fill("http://example.com/img.png") })
      } as Response;
    }
    if (urlStr === CONFIG.FREELLMENDPOINT) {
      const body = JSON.parse(init?.body as string || "{}");
      if (body.prompt.includes("advertising copywriter")) {
        return {
          ok: true,
          json: async () => ({ blocks: Array(8).fill("Text block") })
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ prompts: Array(8).fill("Prompt text") })
      } as Response;
    }
    if (urlStr === CONFIG.FREEVIDEOENDPOINT) {
      return {
        ok: true,
        json: async () => ({ clipPath: "http://example.com/clip.mp4" })
      } as Response;
    }
    if (urlStr === CONFIG.VIDEOSTITCHENDPOINT) {
      return {
        ok: true,
        json: async () => ({ finalVideoPath: "http://example.com/final.mp4" })
      } as Response;
    }
    throw new Error(`Unexpected endpoint: ${urlStr}`);
  }) as typeof globalThis.fetch;

  try {
    const result = await runClaymationAdWorkflow({ topic: "Claymation Eco-Friendly Bottles" });
    if (result.videoPath !== "http://example.com/final.mp4") {
      throw new Error("Workflow final video path mismatch");
    }
    if (result.metadata.topic !== "Claymation Eco-Friendly Bottles") {
      throw new Error("Workflow metadata topic mismatch");
    }
    console.log("✓ Full workflow integration test passed");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("Running tests...");
  await testInfographicBuilder();
  await testOutputAgent();
  await testWorkflowWithMockFetch();
  console.log("All tests passed successfully!");
}

runAllTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
