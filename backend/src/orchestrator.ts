import { BlueAgent } from "./agents/blueAgent.ts";
import { RedAgent } from "./agents/redAgent.ts";
import { BlackAgent } from "./agents/blackAgent.ts";
import { BrowserManager } from "./browser/playwrightManager.ts";

export class AgentOrchestrator {
  private blue: BlueAgent;
  private red: RedAgent;
  private black: BlackAgent;
  private browserManager: BrowserManager;

  constructor(apiKey: string, browserManager: BrowserManager) {
    this.blue = new BlueAgent(apiKey);
    this.red = new RedAgent(apiKey);
    this.black = new BlackAgent(apiKey);
    this.browserManager = browserManager;
  }

  async runTask(goal: string, initialUrl: string, onLog: (log: any) => Promise<void>) {
    let currentStep = 0;
    const maxSteps = 15;

    await onLog({ agent: "ORCHESTRATOR", status: "thinking", message: `Navigating to ${initialUrl}...` });
    await this.browserManager.navigateTo(initialUrl);

    while (currentStep < maxSteps) {
      console.log(`Step ${currentStep + 1}: Starting...`);
      await onLog({ agent: "ORCHESTRATOR", status: "thinking", message: `Capturing page snapshot (Step ${currentStep + 1})...` });
      
      // Small delay to let page settle
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const pageState = await this.browserManager.getPageSnapshot();
      console.log(`Step ${currentStep + 1}: Snapshot captured. URL: ${pageState?.url}`);
      if (pageState) {
        console.log(`Step ${currentStep + 1}: Interactive elements count: ${pageState.interactiveElements.length}`);
        console.log(`Step ${currentStep + 1}: Sample elements:`, JSON.stringify(pageState.interactiveElements.slice(0, 5), null, 2));
      }
      
      if (!pageState) {
        await onLog({ agent: "ORCHESTRATOR", status: "failed", message: "Failed to capture page state." });
        break;
      }

      await onLog({ agent: "BLUE", status: "thinking", message: "Analyzing page state..." });
      console.log(`Step ${currentStep + 1}: Blue Agent thinking...`);
      const blueDecision = await this.blue.analyze(pageState, goal);
      console.log(`Step ${currentStep + 1}: Blue Agent finished. Decision: ${blueDecision.nextStep}`);
      await onLog({ agent: "BLUE", status: "completed", message: `Decision: ${blueDecision.nextStep} (Confidence: ${Math.round(blueDecision.confidence * 100)}%)` });

      if (blueDecision.confidence < 0.7) {
        await onLog({ agent: "BLACK", status: "thinking", message: "Confidence threshold not met. Triggering Fallback Agent..." });
        const blackRecovery = await this.black.recover({ blueDecision, pageState }, goal);
        await onLog({ agent: "BLACK", status: "completed", message: `Fallback Decision: ${blackRecovery.message}` });
        
        if (blackRecovery.status === "success" && blackRecovery.commands) {
          const visualCallback = async () => {
            await onLog({ agent: "BLACK", status: "thinking", message: "Updating visual state..." });
          };

          for (const cmd of blackRecovery.commands) {
            const result = await this.browserManager.executeActions([cmd], visualCallback);
            if (result.status === "success") {
              await onLog({ agent: "BLACK", status: "completed", message: `Recovery Executed: ${cmd.type}` });
            } else {
              await onLog({ agent: "BLACK", status: "failed", message: `Recovery command failed: ${result.message}` });
              break;
            }
          }
        } else {
          await onLog({ agent: "ORCHESTRATOR", status: "failed", message: "Fallback recovery failed to resolve ambiguity." });
          break;
        }
      } else {
        await onLog({ agent: "RED", status: "thinking", message: `Executing action: ${blueDecision.nextStep}` });
        console.log(`Step ${currentStep + 1}: Red Agent executing...`);
        const redResult = await this.red.execute(blueDecision.nextStep, { selector: blueDecision.targetSelector, pageState });
        console.log(`Step ${currentStep + 1}: Red Agent finished. Result: ${redResult.status}`);
        
        if (redResult.status === "success" && redResult.commands) {
          // For visual feedback, we'll execute commands one by one and log/screenshot
          const visualCallback = async () => {
            await onLog({ agent: "RED", status: "thinking", message: "Updating visual state..." });
          };

          for (const cmd of redResult.commands) {
            const result = await this.browserManager.executeActions([cmd], visualCallback);
            if (result.status === "success") {
              await onLog({ agent: "RED", status: "completed", message: `Executed: ${cmd.type} on ${cmd.selector || 'page'}` });
            } else {
              await onLog({ agent: "RED", status: "failed", message: `Command failed: ${result.message}. Escalating...` });
              
              await onLog({ agent: "BLACK", status: "thinking", message: "Analyzing execution failure..." });
              const blackRecovery = await this.black.recover({ redResult, lastAction: blueDecision.nextStep, pageState }, goal);
              
              if (blackRecovery.status === "success" && blackRecovery.commands) {
                for (const rCmd of blackRecovery.commands) {
                  const rResult = await this.browserManager.executeActions([rCmd], visualCallback);
                  if (rResult.status === "success") {
                    await onLog({ agent: "BLACK", status: "completed", message: `Recovery Executed: ${rCmd.type}` });
                  } else {
                    await onLog({ agent: "BLACK", status: "failed", message: `Recovery failed: ${rResult.message}` });
                    break;
                  }
                }
              } else {
                await onLog({ agent: "BLACK", status: "failed", message: `Recovery Failed: ${blackRecovery.message}` });
                break;
              }
            }
          }
        } else {
          await onLog({ agent: "RED", status: "failed", message: `Red Agent failed to generate commands: ${redResult.message}` });
          break;
        }
      }

      if (blueDecision.nextStep.toLowerCase().includes("finish") || blueDecision.nextStep.toLowerCase().includes("complete") || blueDecision.nextStep.toLowerCase().includes("done")) {
        await onLog({ agent: "ORCHESTRATOR", status: "completed", message: "Task objective reached." });
        break;
      }

      currentStep++;
      // Small delay between steps to allow for page transitions
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
}
