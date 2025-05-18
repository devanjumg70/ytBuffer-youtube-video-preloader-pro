
// Background script
console.log('YouTube Force Buffer extension background script initialized');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BUFFER_STATUS') {
    console.log('Buffer status:', message.data);
  }
  return true;
});
