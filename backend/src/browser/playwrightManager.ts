import { chromium, Browser, Page, BrowserContext } from "playwright-core";

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async initialize() {
    if (this.browser) return;

    try {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"] 
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();

      // Inject virtual cursor styles and element
      await this.page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const cursor = document.createElement('div');
          cursor.id = 'agent-cursor';
          cursor.style.position = 'fixed';
          cursor.style.width = '20px';
          cursor.style.height = '20px';
          cursor.style.background = 'rgba(255, 0, 0, 0.5)';
          cursor.style.border = '2px solid white';
          cursor.style.borderRadius = '50%';
          cursor.style.pointerEvents = 'none';
          cursor.style.zIndex = '999999';
          cursor.style.transition = 'all 0.3s ease-out';
          cursor.style.transform = 'translate(-50%, -50%)';
          cursor.style.top = '0px';
          cursor.style.left = '0px';
          document.body.appendChild(cursor);

          const style = document.createElement('style');
          style.innerHTML = `
            #agent-cursor.clicking {
              transform: translate(-50%, -50%) scale(0.8);
              background: rgba(255, 0, 0, 0.8);
            }
          `;
          document.head.appendChild(style);
        });
      });
    } catch (error) {
      console.error("Failed to launch browser:", error);
      throw new Error("Browser initialization failed. Ensure playwright dependencies are installed.");
    }
  }

  async navigateTo(url: string) {
    if (!this.page) await this.initialize();
    await this.page!.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  }

  async getPageSnapshot() {
    if (!this.page) return null;

    const url = this.page.url();
    const title = await this.page.title();
    
    // Extract a simplified DOM tree from all frames
    const allFrames = this.page.frames();
    let interactiveElements: any[] = [];

    for (const frame of allFrames) {
      try {
        const frameElements = await frame.evaluate(() => {
          const elements = Array.from(document.querySelectorAll("button, a, input, select, textarea, [role='button'], h1, h2, h3"));
          return elements.map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim().substring(0, 100) || (el as HTMLInputElement).placeholder || (el as HTMLInputElement).value,
            id: el.id,
            className: el.className,
            ariaLabel: el.getAttribute("aria-label"),
            dataTestId: el.getAttribute("data-testid"),
            href: (el as HTMLAnchorElement).href || null,
            type: (el as any).type,
            isVisible: el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0
          })).filter(el => el.isVisible);
        });
        interactiveElements = [...interactiveElements, ...frameElements];
      } catch (e) {
        // Skip frames that can't be evaluated
      }
    }

    return { url, title, interactiveElements: interactiveElements.slice(0, 100) };
  }

  async getScreenshot() {
    if (!this.page) return null;
    try {
      const buffer = await this.page.screenshot({ type: "jpeg", quality: 50 });
      return buffer.toString("base64");
    } catch (e) {
      return null;
    }
  }

  private async moveCursorTo(selector: string) {
    if (!this.page) return;
    try {
      const element = this.page.locator(selector).first();
      const box = await element.boundingBox();
      if (box) {
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await this.page.evaluate(({ x, y }) => {
          const cursor = document.getElementById('agent-cursor');
          if (cursor) {
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
          }
        }, { x, y });
        await this.page.waitForTimeout(400); // Wait for transition
      }
    } catch (e) {
      console.warn("Could not move cursor to", selector);
    }
  }

  private async animateClick() {
    if (!this.page) return;
    try {
      await this.page.evaluate(() => {
        const cursor = document.getElementById('agent-cursor');
        if (cursor) {
          cursor.classList.add('clicking');
          setTimeout(() => cursor.classList.remove('clicking'), 200);
        }
      });
      await this.page.waitForTimeout(200);
    } catch (e) {}
  }

  async executeActions(commands: any[], onVisualUpdate?: () => Promise<void>) {
    if (!this.page) return { status: "failure", message: "No active page" };

    try {
      for (const cmd of commands) {
        switch (cmd.type) {
          case "click":
            await this.moveCursorTo(cmd.selector);
            if (onVisualUpdate) await onVisualUpdate();
            await this.animateClick();
            await this.page.click(cmd.selector, { timeout: 30000, force: true });
            break;
          case "type":
            await this.moveCursorTo(cmd.selector);
            if (onVisualUpdate) await onVisualUpdate();
            await this.page.type(cmd.selector, cmd.text, { delay: 50, timeout: 30000 });
            break;
          case "press":
            await this.page.press(cmd.selector, cmd.key);
            if (cmd.key === "Enter") {
              await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
            }
            break;
          case "wait":
            await this.page.waitForTimeout(cmd.duration || 1000);
            break;
          case "refresh":
            await this.page.reload({ waitUntil: "networkidle" });
            break;
        }
        if (onVisualUpdate) await onVisualUpdate();
      }
      return { status: "success", message: "Actions executed successfully" };
    } catch (error: any) {
      return { status: "failure", message: error.message };
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
