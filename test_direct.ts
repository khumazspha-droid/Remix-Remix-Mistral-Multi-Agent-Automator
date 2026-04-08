import { AgentOrchestrator } from "./backend/src/orchestrator.ts";
import { BrowserManager } from "./backend/src/browser/playwrightManager.ts";
import dotenv from "dotenv";

dotenv.config();

async function testOrchestrator() {
  const browserManager = new BrowserManager();
  const orchestrator = new AgentOrchestrator(process.env.MISTRAL_API_KEY || "", browserManager);

  const goal = "Search for 'Mistral AI' on DuckDuckGo and summarize the first result.";
  const initialUrl = "https://duckduckgo.com/?q=Mistral+AI";

  console.log("Starting Orchestrator Test...");

  try {
    await orchestrator.runTask(goal, initialUrl, async (log) => {
      console.log(`[${log.agent}] ${log.status}: ${log.message}`);
    });
    console.log("Test Completed Successfully");
  } catch (error) {
    console.error("Test Failed:", error);
  } finally {
    await browserManager.close();
  }
}

testOrchestrator();
