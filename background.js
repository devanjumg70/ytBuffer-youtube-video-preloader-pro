
/**
 * YouTube Force Buffer - Background Script
 * Handles communication with content script and maintains extension state
 */

// Extension state
const extensionState = {
  activeTabIds: new Set(),
  fixedVideos: 0,
  isEnabled: true,
  debugMode: true,
  settings: null
};

// Log message with timestamp
const logWithTime = (message) => {
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] YouTube Force Buffer: ${message}`);
};

// Error handler
const handleError = (error, context) => {
  const errorMessage = error.message || String(error);
  logWithTime(`Error ${context}: ${errorMessage}`);
  
  // Send error to popup if it's open
  try {
    chrome.runtime.sendMessage({
      type: 'LOG_MESSAGE',
      data: {
        message: `Error ${context}: ${errorMessage}`,
        logType: 'error'
      }
    }).catch(() => {
      // Popup might not be open, ignore the error
    });
  } catch (e) {
    // Ignore messaging errors
  }
};

// Initialize settings
const loadSettings = () => {
  try {
    chrome.storage.sync.get([
      'isEnabled', 
      'debugMode', 
      'bufferTimeout', 
      'bufferPercentage',
      'autoPauseEnabled',
      'preloadQuality'
    ], (result) => {
      if (chrome.runtime.lastError) {
        handleError(chrome.runtime.lastError, 'loading settings');
        return;
      }
      
      // Set defaults if not found
      extensionState.settings = {
        isEnabled: result.isEnabled !== undefined ? result.isEnabled : true,
        debugMode: result.debugMode !== undefined ? result.debugMode : true,
        bufferTimeout: result.bufferTimeout !== undefined ? result.bufferTimeout : 10,
        bufferPercentage: result.bufferPercentage !== undefined ? result.bufferPercentage : 25,
        autoPauseEnabled: result.autoPauseEnabled !== undefined ? result.autoPauseEnabled : true,
        preloadQuality: result.preloadQuality || 'auto'
      };
      
      // Update global state
      extensionState.isEnabled = extensionState.settings.isEnabled;
      extensionState.debugMode = extensionState.settings.debugMode;
      
      logWithTime('Settings loaded');
    });
  } catch (error) {
    handleError(error, 'initializing settings');
  }
};

// Initialize the extension
logWithTime('Extension initialized');
loadSettings();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
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
    
    else if (message.type === 'LOADING_FIX') {
      logWithTime(`Loading fix attempt: ${message.data.attempt} of ${message.data.max}`);
      
      // Forward to popup if it's open
      chrome.runtime.sendMessage(message).catch(() => {
        // Popup might not be open, ignore the error
      });
    }
    
    else if (message.type === 'LOG_MESSAGE') {
      logWithTime(`Log: ${message.data.message}`);
      
      // Forward to popup if it's open
      chrome.runtime.sendMessage(message).catch(() => {
        // Popup might not be open, ignore the error
      });
    }
    
    else if (message.type === 'GET_SETTINGS') {
      // Send settings to the content script that requested them
      const tabId = sender.tab?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          type: 'SETTINGS_UPDATE',
          data: extensionState.settings
        }).catch((error) => {
          handleError(error, 'sending settings to tab');
        });
      }
    }
    
    else if (message.type === 'UPDATE_SETTINGS') {
      // Update settings from popup
      extensionState.settings = message.data;
      extensionState.isEnabled = message.data.isEnabled;
      extensionState.debugMode = message.data.debugMode;
      
      // Broadcast to all active YouTube tabs
      extensionState.activeTabIds.forEach(tabId => {
        chrome.tabs.sendMessage(tabId, {
          type: 'SETTINGS_UPDATE',
          data: extensionState.settings
        }).catch((error) => {
          // Tab might be closed, remove from active tabs
          extensionState.activeTabIds.delete(tabId);
          handleError(error, `sending settings to tab ${tabId}`);
        });
      });
    }
  } catch (error) {
    handleError(error, 'processing message');
  }
  
  return true;
});

// Track when YouTube tabs are opened or closed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
      extensionState.activeTabIds.add(tabId);
      logWithTime(`YouTube video page loaded in tab ${tabId}`);
      
      // Send current settings to the content script
      if (extensionState.settings) {
        chrome.tabs.sendMessage(tabId, {
          type: 'SETTINGS_UPDATE',
          data: extensionState.settings
        }).catch((error) => {
          // Content script might not be ready yet, this is fine
        });
      }
    }
  } catch (error) {
    handleError(error, 'handling tab update');
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  try {
    if (extensionState.activeTabIds.has(tabId)) {
      extensionState.activeTabIds.delete(tabId);
      logWithTime(`YouTube tab ${tabId} closed`);
    }
  } catch (error) {
    handleError(error, 'handling tab removal');
  }
});

// Listen for storage changes to update settings in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    try {
      // Update settings
      Object.keys(changes).forEach(key => {
        if (extensionState.settings && key in extensionState.settings) {
          extensionState.settings[key] = changes[key].newValue;
          
          // Update global state for key settings
          if (key === 'isEnabled') extensionState.isEnabled = changes[key].newValue;
          if (key === 'debugMode') extensionState.debugMode = changes[key].newValue;
        }
      });
      
      logWithTime('Settings updated from storage change');
    } catch (error) {
      handleError(error, 'processing storage changes');
    }
  }
});
