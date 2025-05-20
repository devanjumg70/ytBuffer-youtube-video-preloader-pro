
/**
 * YouTube Force Buffer - Background Script
 * Handles communication with content script and maintains extension state
 */

// Extension state
const extensionState = {
  activeTabIds: new Set(),
  fixedVideos: 0
};

// Log message with timestamp
const logWithTime = (message) => {
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] YouTube Force Buffer: ${message}`);
};

// Initialize the extension
logWithTime('Extension initialized');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BUFFER_STATUS') {
    logWithTime(`Buffer status from tab ${sender.tab?.id}: ${message.data.status}`);
    
    if (message.data.status === 'complete') {
      extensionState.fixedVideos++;
    }
    
    // Forward to popup if it's open
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup might not be open, ignore the error
    });
  }
  
  if (message.type === 'LOADING_FIX') {
    logWithTime(`Loading fix attempt: ${message.data.attempt} of ${message.data.max}`);
    
    // Forward to popup if it's open
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup might not be open, ignore the error
    });
  }
  
  if (message.type === 'LOG_MESSAGE') {
    logWithTime(`Log: ${message.data.message}`);
    
    // Forward to popup if it's open
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup might not be open, ignore the error
    });
  }
  
  return true;
});

// Track when YouTube tabs are opened or closed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    extensionState.activeTabIds.add(tabId);
    logWithTime(`YouTube video page loaded in tab ${tabId}`);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (extensionState.activeTabIds.has(tabId)) {
    extensionState.activeTabIds.delete(tabId);
    logWithTime(`YouTube tab ${tabId} closed`);
  }
});
