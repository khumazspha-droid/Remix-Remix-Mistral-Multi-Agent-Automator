import fetch from "node-fetch";

async function runDemo() {
  const goal = "Search for 'Mistral AI' on DuckDuckGo and summarize the first result.";
  console.log(`Starting demonstration with goal: "${goal}"`);

  try {
    const response = await fetch("http://localhost:3000/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        goal, 
        pageState: { url: "https://www.google.com" } 
      }),
      timeout: 900000, // 15 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("\n--- DEMONSTRATION LOGS ---\n");
    data.logs.forEach((log: any) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      console.log(`[${timestamp}] ${log.agent} (${log.status}): ${log.message}`);
    });
    console.log("\n--- END OF DEMONSTRATION ---\n");

  } catch (error: any) {
    console.error("Demonstration failed:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

runDemo();
