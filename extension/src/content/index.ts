chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanDOM") {
    const elements = Array.from(document.querySelectorAll("button, a, input, [role='button']")).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().substring(0, 50),
      id: el.id,
      className: el.className,
      type: (el as any).type
    }));
    
    sendResponse({ 
      url: window.location.href,
      title: document.title,
      interactiveElements: elements.slice(0, 50) // Limit for LLM context
    });
  }
  return true;
});
