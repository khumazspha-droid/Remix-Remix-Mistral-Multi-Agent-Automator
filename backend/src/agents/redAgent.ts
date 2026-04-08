import { Mistral } from "@mistralai/mistralai";

export class RedAgent {
  private mistral: Mistral;
  private agentId = "ag_019d3f38dfd2721cb947ec4597d6eaa8";

  constructor(apiKey: string) {
    this.mistral = new Mistral({ apiKey, timeoutMs: 120000 });
  }

  async execute(action: string, context: any) {
    const prompt = `
      You are the Red Agent (Action Specialist).
      Action to perform: ${action}
      Context: ${JSON.stringify(context)}
      
      Handle form filling, clicking, typing, or document uploads.
      Provide the specific browser commands to execute.
      
      Available command types:
      - { "type": "click", "selector": "css-selector" }
      - { "type": "type", "selector": "css-selector", "text": "value" }
      - { "type": "press", "selector": "css-selector", "key": "Enter" }
      - { "type": "wait", "duration": 2000 }
      - { "type": "refresh" }
      
      IMPORTANT: If the goal involves searching or submitting a form, prefer using 'type' followed by 'press' with 'Enter' on the input field, as buttons can sometimes be obscured or dynamic.
      
      If the action says "press Enter", ensure you include a "press" command with "Enter".
      
      Respond in JSON format:
      {
        "commands": [
          { "type": "type", "selector": "input[name='q']", "text": "Mistral AI" },
          { "type": "press", "selector": "input[name='q']", "key": "Enter" }
        ],
        "status": "success",
        "message": "Description of what was done"
      }
    `;

    const response = await this.mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" }
    });

    const content = response.choices?.[0]?.message?.content;
    return typeof content === "string" ? JSON.parse(content) : content;
  }
}
