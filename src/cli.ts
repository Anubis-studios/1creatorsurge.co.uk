import { CONFIG } from "./config";
import { runClaymationAdWorkflow } from "./main/ClaymationInfographicAdGenerator";

async function main() {
  const args = process.argv.slice(2);
  let topic = "Claymation Product Ad";
  const isMock = args.includes("--mock");

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--topic" && args[i + 1]) {
      topic = args[i + 1];
      i++;
    }
  }

  console.log(`[CI App] Running Claymation Infographic Ad Generator for topic: "${topic}"...`);

  if (isMock || process.env.CI || process.env.NODE_ENV === "test") {
    console.log("[CI App] Offline / CI mode detected. Mocking agent HTTP endpoints...");
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
        const body = JSON.parse((init?.body as string) || "{}");
        if (body.prompt?.includes("advertising copywriter")) {
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
      return originalFetch(url, init);
    }) as typeof globalThis.fetch;
  }

  try {
    const output = await runClaymationAdWorkflow({ topic });
    console.log("[CI App] Workflow completed successfully!");
    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    console.error("[CI App] Workflow execution failed:", error);
    process.exit(1);
  }
}

main();
