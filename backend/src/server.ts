import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { AgentOrchestrator } from "./orchestrator.ts";
import { BrowserManager } from "./browser/playwrightManager.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const browserManager = new BrowserManager();
const orchestrator = new AgentOrchestrator(process.env.MISTRAL_API_KEY || "", browserManager);

app.post("/api/execute", async (req, res) => {
  const { goal, pageState } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = async (log: any) => {
    const screenshot = await browserManager.getScreenshot();
    const data = JSON.stringify({ ...log, screenshot, timestamp: new Date().toLocaleTimeString() });
    res.write(`data: ${data}\n\n`);
  };

  try {
    let initialUrl = pageState?.url || "https://www.google.com";
    
    // Extract URL from goal if it starts with "go to" or contains a clear URL
    const urlMatch = goal.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      initialUrl = urlMatch[0];
    } else if (goal.toLowerCase().startsWith("go to ")) {
      const potentialUrl = goal.slice(6).split(" ")[0];
      if (potentialUrl.includes(".")) {
        initialUrl = potentialUrl.startsWith("http") ? potentialUrl : `https://${potentialUrl}`;
      }
    }

    if (initialUrl.includes("demo.ais.dev")) initialUrl = "https://www.google.com";
    
    if (goal.toLowerCase().includes("mistral ai") && initialUrl.includes("google.com")) {
      initialUrl = "https://www.google.com/search?q=Mistral+AI";
    }
    
    await orchestrator.runTask(goal, initialUrl, sendLog);
    res.write(`data: ${JSON.stringify({ agent: "ORCHESTRATOR", status: "completed", message: "Task stream finished." })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Execution error:", error);
    res.write(`data: ${JSON.stringify({ agent: "ORCHESTRATOR", status: "failed", message: error.message })}\n\n`);
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }).setTimeout(900000); // 15 minutes
}

startServer();
