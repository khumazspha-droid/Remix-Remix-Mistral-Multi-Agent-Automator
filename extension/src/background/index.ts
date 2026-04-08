chrome.runtime.onInstalled.addListener(() => {
  console.log("Blue & Red AI Agent Extension Installed");
});

// Relay messages between popup and content scripts if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);
  return true;
});
