import { Mistral } from "@mistralai/mistralai";

export class BlackAgent {
  private mistral: Mistral;
  private agentId = "ag_019d6450099d70daa2f1461c627e4ffe";

  constructor(apiKey: string) {
    this.mistral = new Mistral({ apiKey, timeoutMs: 120000 });
  }

  async recover(failureContext: any, goal: string) {
    const prompt = `
      You are the Black Agent (Fallback Specialist). 
      Personality: Confident, assertive, and direct. You fix failures without hesitation.
      
      Goal: ${goal}
      Failure Context: ${JSON.stringify(failureContext)}
      
      The Red Agent failed to execute or the Blue Agent was unsure. Analyze the situation and provide a direct fix.
      
      Available command types:
      - { "type": "click", "selector": "css-selector" }
      - { "type": "type", "selector": "css-selector", "text": "value" }
      - { "type": "press", "selector": "css-selector", "key": "Enter" }
      - { "type": "wait", "duration": 2000 }
      
      Respond in JSON format:
      {
        "commands": [
          { "type": "click", "selector": "#alternative-submit" },
          { "type": "type", "selector": "#fix-input", "text": "recovery-action" }
        ],
        "status": "success",
        "message": "I have identified the blockage and executed a direct bypass."
      }
    `;

    console.log(`Step: Black Agent API call starting...`);
    const response = await this.mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" }
    });

    const content = response.choices?.[0]?.message?.content;
    console.log(`Step: Black Agent API call completed.`);
    return typeof content === "string" ? JSON.parse(content) : content;
  }
}
