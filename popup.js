
document.addEventListener('DOMContentLoaded', function() {
  // UI Elements
  const enableExtensionToggle = document.getElementById('enableExtension');
  const debugModeToggle = document.getElementById('debugMode');
  const autoPauseToggle = document.getElementById('autoPauseEnabled');
  const bufferPercentageSlider = document.getElementById('bufferPercentage');
  const bufferPercentageValue = document.getElementById('bufferPercentageValue');
  const bufferTimeoutSlider = document.getElementById('bufferTimeout');
  const bufferTimeoutValue = document.getElementById('bufferTimeoutValue');
  const statusElement = document.getElementById('status');
  const fixedVideosElement = document.getElementById('fixedVideos');
  const logsContainer = document.getElementById('logs');
  
  // Extension state
  let extensionState = {
    isEnabled: true,
    debugMode: true,
    bufferTimeout: 10,
    bufferPercentage: 25,
    autoPauseEnabled: true,
    fixedVideos: 0,
    status: 'Active'
  };
  
  // Load settings from storage
  chrome.storage.sync.get([
    'isEnabled', 
    'debugMode', 
    'bufferTimeout', 
    'bufferPercentage',
    'autoPauseEnabled'
  ], function(result) {
    // Update UI with saved settings or defaults
    extensionState = {
      ...extensionState,
      isEnabled: result.isEnabled !== undefined ? result.isEnabled : true,
      debugMode: result.debugMode !== undefined ? result.debugMode : true,
      bufferTimeout: result.bufferTimeout !== undefined ? result.bufferTimeout : 10,
      bufferPercentage: result.bufferPercentage !== undefined ? result.bufferPercentage : 25,
      autoPauseEnabled: result.autoPauseEnabled !== undefined ? result.autoPauseEnabled : true
    };
    
    // Update UI
    updateUI();
  });
  
  // Update UI to match current state
  function updateUI() {
    enableExtensionToggle.checked = extensionState.isEnabled;
    debugModeToggle.checked = extensionState.debugMode;
    autoPauseToggle.checked = extensionState.autoPauseEnabled;
    bufferPercentageSlider.value = extensionState.bufferPercentage;
    bufferPercentageValue.textContent = extensionState.bufferPercentage + '%';
    bufferTimeoutSlider.value = extensionState.bufferTimeout;
    bufferTimeoutValue.textContent = extensionState.bufferTimeout + 's';
    statusElement.textContent = extensionState.isEnabled ? 'Active' : 'Disabled';
  }
  
  // Save settings to storage and notify background script
  function saveSettings() {
    chrome.storage.sync.set({
      isEnabled: extensionState.isEnabled,
      debugMode: extensionState.debugMode,
      bufferTimeout: extensionState.bufferTimeout,
      bufferPercentage: extensionState.bufferPercentage,
      autoPauseEnabled: extensionState.autoPauseEnabled
    });
    
    // Send updated settings to background script
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: extensionState
    });
  }
  
  // Event listeners for UI controls
  enableExtensionToggle.addEventListener('change', function() {
    extensionState.isEnabled = this.checked;
    saveSettings();
    updateUI();
    addLogEntry(extensionState.isEnabled ? 'Extension enabled' : 'Extension disabled', extensionState.isEnabled ? 'success' : 'warning');
  });
  
  debugModeToggle.addEventListener('change', function() {
    extensionState.debugMode = this.checked;
    saveSettings();
    addLogEntry('Debug mode ' + (extensionState.debugMode ? 'enabled' : 'disabled'), 'info');
  });
  
  autoPauseToggle.addEventListener('change', function() {
    extensionState.autoPauseEnabled = this.checked;
    saveSettings();
    addLogEntry('Auto-pause ' + (extensionState.autoPauseEnabled ? 'enabled' : 'disabled'), 'info');
  });
  
  bufferPercentageSlider.addEventListener('input', function() {
    extensionState.bufferPercentage = parseInt(this.value);
    bufferPercentageValue.textContent = extensionState.bufferPercentage + '%';
  });
  
  bufferPercentageSlider.addEventListener('change', function() {
    saveSettings();
    addLogEntry(`Buffer percentage set to ${extensionState.bufferPercentage}%`, 'info');
  });
  
  bufferTimeoutSlider.addEventListener('input', function() {
    extensionState.bufferTimeout = parseInt(this.value);
    bufferTimeoutValue.textContent = extensionState.bufferTimeout + 's';
  });
  
  bufferTimeoutSlider.addEventListener('change', function() {
    saveSettings();
    addLogEntry(`Loading timeout set to ${extensionState.bufferTimeout}s`, 'info');
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.type === 'BUFFER_STATUS') {
      if (message.data.status === 'complete') {
        extensionState.fixedVideos++;
        fixedVideosElement.textContent = extensionState.fixedVideos;
        addLogEntry('Video buffering completed', 'success');
      } else if (message.data.status === 'started') {
        addLogEntry('Video buffering started', 'info');
      }
    }
    else if (message.type === 'LOADING_FIX') {
      addLogEntry(`Loading fix attempt ${message.data.attempt}/${message.data.max}`, 'warning');
    }
    else if (message.type === 'LOG_MESSAGE') {
      addLogEntry(message.data.message, message.data.logType || 'info');
    }
  });
  
  // Add log entry to UI
  function addLogEntry(message, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = message;
    logsContainer.prepend(entry);
    
    // Limit number of log entries
    if (logsContainer.children.length > 50) {
      logsContainer.removeChild(logsContainer.lastChild);
    }
  }
  
  // Request current stats from background script
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).catch(() => {
    // Ignore errors if background script is not ready
  });
});
