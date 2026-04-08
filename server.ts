import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || "",
});

const AGENTS = {
  BLUE: {
    id: "ag_019d3f32fc3576c6a94b8b8e033c700f",
    role: "Planner",
  },
  RED: {
    id: "ag_019d3f38dfd2721cb947ec4597d6eaa8",
    role: "Executor",
  },
  BLACK: {
    id: "ag_019d6450099d70daa2f1461c627e4ffe",
    role: "Fallback",
  },
};

app.post("/api/execute", async (req, res) => {
  const { goal } = req.body;

  if (!process.env.MISTRAL_API_KEY) {
    return res.status(500).json({ error: "MISTRAL_API_KEY is not configured." });
  }

  const logs: any[] = [];

  try {
    // 1. Blue Agent (Planner)
    logs.push({ agent: "BLUE", status: "thinking", message: "Generating plan..." });
    const blueResponse = await mistral.agents.complete({
      agentId: AGENTS.BLUE.id,
      messages: [{ role: "user", content: goal }],
    });
    
    const blueContent = blueResponse.choices?.[0]?.message?.content;
    const plan = typeof blueContent === "string" ? blueContent : JSON.stringify(blueContent) || "No plan generated.";
    logs.push({ agent: "BLUE", status: "completed", message: plan });

    // 2. Red Agent (Executor)
    logs.push({ agent: "RED", status: "thinking", message: "Executing plan..." });
    let redSuccess = false;
    let redResult = "";

    try {
      const redResponse = await mistral.agents.complete({
        agentId: AGENTS.RED.id,
        messages: [
          { role: "system", content: "You are the Red Agent (Executor). Follow the plan provided by the Blue Agent." },
          { role: "user", content: `Goal: ${goal}\nPlan: ${plan}` }
        ],
      });
      const redContent = redResponse.choices?.[0]?.message?.content;
      redResult = typeof redContent === "string" ? redContent : JSON.stringify(redContent) || "No execution result.";
      
      // Simple heuristic for failure: if the response is too short or contains "fail" or "error"
      if (redResult.toLowerCase().includes("fail") || redResult.toLowerCase().includes("error") || redResult.length < 10) {
        throw new Error("Red Agent execution failed.");
      }
      
      redSuccess = true;
      logs.push({ agent: "RED", status: "completed", message: redResult });
    } catch (error: any) {
      logs.push({ agent: "RED", status: "failed", message: error.message || "Execution failed." });
      
      // 3. Black Agent (Fallback)
      logs.push({ agent: "BLACK", status: "thinking", message: "Red failed. Taking control..." });
      const blackResponse = await mistral.agents.complete({
        agentId: AGENTS.BLACK.id,
        messages: [
          { role: "system", content: "You are the Black Agent (Fallback). The Red Agent failed to execute the plan. Fix the failure and complete the task." },
          { role: "user", content: `Goal: ${goal}\nPlan: ${plan}\nRed Failure: ${redResult}` }
        ],
      });
      const blackContent = blackResponse.choices?.[0]?.message?.content;
      const blackResult = typeof blackContent === "string" ? blackContent : JSON.stringify(blackContent) || "Fallback failed.";
      logs.push({ agent: "BLACK", status: "completed", message: blackResult });
    }

    res.json({ success: true, logs });
  } catch (error: any) {
    console.error("Execution error:", error);
    res.status(500).json({ error: error.message || "An error occurred during execution." });
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
  });
}

startServer();
