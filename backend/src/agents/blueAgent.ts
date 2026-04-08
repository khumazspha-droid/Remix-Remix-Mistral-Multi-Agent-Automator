import { Mistral } from "@mistralai/mistralai";

export class BlueAgent {
  private mistral: Mistral;
  private agentId = "ag_019d3f32fc3576c6a94b8b8e033c700f";

  constructor(apiKey: string) {
    this.mistral = new Mistral({ apiKey, timeoutMs: 120000 });
  }

  async analyze(pageState: any, goal: string) {
    const prompt = `
      You are the Blue Agent (Navigation Specialist). 
      Goal: ${goal}
      Current Page State: ${JSON.stringify(pageState)}
      
      Analyze the provided 'interactiveElements' array in the page state. 
      Each element has 'tag', 'text', 'id', 'className', 'ariaLabel', and 'dataTestId'.
      
      CRITICAL: If the current page is a search engine (Google, Bing, etc.) and the goal specifies a specific website (e.g., GitHub, Mistral), do NOT try to type the URL into the search box. Instead, look for the official link in the results or, if you are stuck on a bot detection/consent page, indicate that you need to navigate directly.
      
      Determine the next navigation step. 
      - If you need to search, specify typing and pressing Enter.
      - If you see a 'bot detection', 'anomaly', 'consent', or 'privacy' modal (e.g., "Accept all", "I agree"), you MUST CLICK the button to dismiss it immediately.
      - If you are stuck on a bot detection page and cannot see any buttons to click, you MUST include 'FINISH' and explain that a CAPTCHA or Bot Detection is blocking progress.
      - If you have already tried typing and pressing Enter but the page hasn't changed, try CLICKING the search button instead.
      - LOOP DETECTION: If you find yourself performing the same action (e.g., clicking the same 'Submit' button) more than twice without the URL or page content changing, you are in a loop. Try a different element, or use the 'refresh' command to reload the page.
      - If you are stuck on a redirect/interstitial page that won't advance, try 'refresh' or look for a hidden 'Skip' or 'Continue' button.
      - Do NOT repeat the same failing action more than twice.
      - Do NOT finish until you have visited the page and can see its content.
      
      Available action types for your response:
      - click: Click on a selector.
      - type: Type text into a selector.
      - press: Press a key (e.g., 'Enter').
      - wait: Wait for a duration.
      - refresh: Reload the current page.
      - finish: Complete the task.
      
      Provide a confidence score (0.0 to 1.0).
      
      Respond in JSON format:
      {
        "nextStep": "Detailed description of the action. If the task is finished, you MUST include the word 'FINISH' or 'COMPLETE' in this field.",
        "targetSelector": "The CSS selector for the primary element involved",
        "confidence": 0.95,
        "reasoning": "Explain your logic based on the goal and current page state."
      }
    `;

    console.log(`Step: Blue Agent API call starting...`);
    const response = await this.mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" }
    });

    const content = response.choices?.[0]?.message?.content;
    console.log(`Step: Blue Agent API call completed.`);
    return typeof content === "string" ? JSON.parse(content) : content;
  }
}
