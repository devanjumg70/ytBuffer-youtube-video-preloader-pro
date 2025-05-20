/**
 * YouTube Force Buffer - Content Script
 * Forces complete video buffering on YouTube videos and fixes stuck loading videos
 */

(function() {
  'use strict';
  
  // Configuration - will be updated from extension settings
  const config = {
    checkInterval: 1000,         // How often to check video buffer status (ms)
    seekStepSize: 30,            // How far to seek ahead when forcing buffer (seconds)
    maxSeekAttempts: 100,        // Maximum number of seek attempts
    debugMode: true,             // Enable console logging for debugging
    loadingTimeoutSecs: 10,      // Time (seconds) to wait before considering a video stuck in loading
    loadingFixAttempts: 3,       // Number of attempts to fix a stuck loading video
    loadingFixDelay: 1500,       // Delay between loading fix attempts (ms)
    isEnabled: true,             // Extension enabled state
    bufferPercentage: 25,        // Percentage of video to buffer before playing
    autoPauseEnabled: true       // Whether to auto-pause when buffer runs low
  };
  
  let videoElement = null;
  let originalPlaybackRate = 1;
  let originalPlaybackTime = 0;
  let isBuffering = false;
  let seekAttempts = 0;
  let bufferCheckInterval = null;
  let loadingFixTimer = null;
  let loadingFixAttempts = 0;
  let lastProgressTime = 0;
  let isStuckInLoading = false;
  let monitoringActive = false;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  /**
   * Debug logger that only logs when debug mode is enabled
   */
  const debugLog = (...args) => {
    if (config.debugMode) {
      console.log('[YT Force Buffer]', ...args);
      
      // Send log to extension page
      try {
        chrome.runtime.sendMessage({
          type: 'LOG_MESSAGE',
          data: { 
            message: args.join(' '),
            logType: 'info'
          }
        }).catch(e => {
          reconnectToExtension();
        });
      } catch (e) {
        reconnectToExtension();
      }
    }
  };
  
  /**
   * Helper function to send warning logs
   */
  const warningLog = (...args) => {
    if (config.debugMode) {
      console.warn('[YT Force Buffer]', ...args);
      
      // Send log to extension page
      try {
        chrome.runtime.sendMessage({
          type: 'LOG_MESSAGE',
          data: { 
            message: args.join(' '),
            logType: 'warning'
          }
        }).catch(e => {
          reconnectToExtension();
        });
      } catch (e) {
        reconnectToExtension();
      }
    }
  };
  
  /**
   * Helper function to send error logs
   */
  const errorLog = (...args) => {
    if (config.debugMode) {
      console.error('[YT Force Buffer]', ...args);
      
      // Send log to extension page
      try {
        chrome.runtime.sendMessage({
          type: 'LOG_MESSAGE',
          data: { 
            message: args.join(' '),
            logType: 'error'
          }
        }).catch(e => {
          reconnectToExtension();
        });
      } catch (e) {
        reconnectToExtension();
      }
    }
  };
  
  /**
   * Helper function to send success logs
   */
  const successLog = (...args) => {
    if (config.debugMode) {
      console.log('[YT Force Buffer SUCCESS]', ...args);
      
      // Send log to extension page
      try {
        chrome.runtime.sendMessage({
          type: 'LOG_MESSAGE',
          data: { 
            message: args.join(' '),
            logType: 'success'
          }
        }).catch(e => {
          reconnectToExtension();
        });
      } catch (e) {
        reconnectToExtension();
      }
    }
  };
  
  /**
   * Attempts to reconnect to the extension when messaging fails
   */
  const reconnectToExtension = () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[YT Force Buffer] Max reconnection attempts reached. Please refresh the page.');
      return;
    }
    
    reconnectAttempts++;
    console.warn(`[YT Force Buffer] Connection to extension lost. Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    
    // Try to get settings to test connection
    setTimeout(() => {
      try {
        chrome.runtime.sendMessage({
          type: 'GET_SETTINGS',
          data: {}
        }).then(() => {
          console.log('[YT Force Buffer] Reconnected to extension');
          reconnectAttempts = 0;
        }).catch(e => {
          // Still not connected
        });
      } catch (e) {
        // Still not connected
      }
    }, 2000 * reconnectAttempts); // Exponential backoff
  };
  
  /**
   * Checks if the video is fully buffered
   * @param {HTMLVideoElement} video - The video element to check
   * @returns {boolean} - Whether the video is fully buffered
   */
  const isVideoFullyBuffered = (video) => {
    if (!video || !video.buffered || video.buffered.length === 0) {
      return false;
    }
    
    // Get the buffered range that contains the current time
    const currentTime = video.currentTime;
    const duration = video.duration;
    
    // If we can't determine duration, we can't know if it's fully buffered
    if (isNaN(duration) || !isFinite(duration)) {
      return false;
    }
    
    // For each buffered range, check if we have buffered to near the end
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i);
      const end = video.buffered.end(i);
      
      // If this range covers from current position to near the end, video is fully buffered
      if (start <= currentTime && end >= duration - 1) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Gets the furthest buffered time for the video
   * @param {HTMLVideoElement} video - The video element
   * @returns {number} - The furthest buffered time in seconds
   */
  const getFurthestBufferedTime = (video) => {
    if (!video || !video.buffered || video.buffered.length === 0) {
      return 0;
    }
    
    // Find the furthest buffered end time
    let maxBufferedEnd = 0;
    for (let i = 0; i < video.buffered.length; i++) {
      const end = video.buffered.end(i);
      if (end > maxBufferedEnd) {
        maxBufferedEnd = end;
      }
    }
    
    return maxBufferedEnd;
  };
  
  /**
   * Calculates the current buffer percentage
   * @param {HTMLVideoElement} video - The video element
   * @returns {number} - Buffer percentage (0-100)
   */
  const getBufferPercentage = (video) => {
    if (!video || !video.buffered || video.buffered.length === 0 || !isFinite(video.duration)) {
      return 0;
    }
    
    const furthestBuffered = getFurthestBufferedTime(video);
    return Math.round((furthestBuffered / video.duration) * 100);
  };
  
  /**
   * Detects if a video is stuck in the loading state
   * @param {HTMLVideoElement} video - The video element to check
   * @returns {boolean} - Whether the video is stuck in loading
   */
  const isVideoStuckInLoading = (video) => {
    if (!video || video.readyState >= 3 || video.currentTime > 0.5) {
      return false;
    }
    
    // Check if we've had no progress for a while
    const now = Date.now();
    if (lastProgressTime === 0) {
      lastProgressTime = now;
      return false;
    }
    
    // If the video has been stuck in loading state for too long, consider it stuck
    return (now - lastProgressTime) > (config.loadingTimeoutSecs * 1000);
  };
  
  /**
   * Attempts to fix a video that's stuck in the loading state
   * @param {HTMLVideoElement} video - The video element to fix
   */
  const fixStuckLoadingVideo = (video) => {
    if (!video || loadingFixAttempts >= config.loadingFixAttempts) {
      debugLog('Max loading fix attempts reached, giving up');
      isStuckInLoading = false;
      loadingFixAttempts = 0;
      return;
    }
    
    warningLog(`Attempting to fix stuck loading video (attempt ${loadingFixAttempts + 1}/${config.loadingFixAttempts})`);
    
    // Notify background about fix attempt
    try {
      chrome.runtime.sendMessage({
        type: 'LOADING_FIX',
        data: {
          attempt: loadingFixAttempts + 1,
          max: config.loadingFixAttempts
        }
      });
    } catch (error) {
      console.error('Error sending loading fix message:', error);
    }
    
    // Try different techniques to unstick the video
    try {
      // Force readyState by seeking to the beginning
      video.currentTime = 0;
      
      // Try toggling play/pause
      if (video.paused) {
        video.play().catch(e => debugLog('Error trying to play:', e));
      } else {
        video.pause();
        setTimeout(() => video.play().catch(e => debugLog('Error trying to play:', e)), 300);
      }
      
      // Try to force a quality change by accessing YouTube's player API
      const ytPlayer = findYouTubePlayer();
      if (ytPlayer && typeof ytPlayer.getAvailableQualityLevels === 'function') {
        const qualities = ytPlayer.getAvailableQualityLevels();
        if (qualities && qualities.length > 1) {
          const currentQuality = ytPlayer.getPlaybackQuality();
          const alternateQuality = qualities.find(q => q !== currentQuality) || qualities[0];
          ytPlayer.setPlaybackQuality(alternateQuality);
          debugLog(`Changed quality from ${currentQuality} to ${alternateQuality}`);
        }
      }
      
      // Reset the timeouts and increment attempt counter
      lastProgressTime = Date.now();
      loadingFixAttempts++;
      
      // Schedule the next attempt
      if (loadingFixAttempts < config.loadingFixAttempts) {
        loadingFixTimer = setTimeout(() => {
          if (video.readyState < 3) {
            fixStuckLoadingVideo(video);
          } else {
            isStuckInLoading = false;
            loadingFixAttempts = 0;
            debugLog('Video unstuck from loading state!');
          }
        }, config.loadingFixDelay);
      }
    } catch (error) {
      errorLog('Error while trying to fix stuck loading:', error);
    }
    
    // If we make the final attempt, add an error log
    if (loadingFixAttempts >= config.loadingFixAttempts) {
      errorLog('All fix attempts failed. The video may be experiencing network issues.');
    }
  };
  
  /**
   * Tries to find YouTube's player API object
   * @returns {Object|null} - YouTube player API object or null if not found
   */
  const findYouTubePlayer = () => {
    try {
      // Try to find YouTube's API from the window object
      if (window.ytplayer && window.ytplayer.config) {
        return window.ytplayer.config.player;
      }
      
      // Try to find YouTube's player from the video element
      const videoElement = document.querySelector('video');
      if (videoElement) {
        // Look up the DOM tree to find YouTube player
        let element = videoElement;
        while (element && element !== document.body) {
          if (element.id === 'movie_player' || element.classList.contains('html5-video-player')) {
            return element;
          }
          element = element.parentElement;
        }
      }
    } catch (error) {
      errorLog('Error finding YouTube player:', error);
    }
    
    return null;
  };
  
  /**
   * Forces video buffering by manipulating the playback speed and using seeking
   */
  const forceBuffering = () => {
    if (!videoElement || 
        !config.isEnabled || 
        isVideoFullyBuffered(videoElement) || 
        seekAttempts >= config.maxSeekAttempts) {
      stopBuffering();
      return;
    }
    
    if (!isBuffering) {
      // Store original state
      originalPlaybackRate = videoElement.playbackRate;
      originalPlaybackTime = videoElement.currentTime;
      isBuffering = true;
      
      // Pause the video while buffering
      if (!videoElement.paused) {
        videoElement.pause();
      }
      
      debugLog("Started buffer forcing");
      
      // Notify about buffering start
      try {
        chrome.runtime.sendMessage({
          type: 'BUFFER_STATUS',
          data: { status: 'started' }
        });
      } catch (error) {
        console.error('Error sending buffer status message:', error);
      }
    }
    
    try {
      const duration = videoElement.duration;
      const furthestBufferedTime = getFurthestBufferedTime(videoElement);
      const remainingTime = duration - furthestBufferedTime;
      const bufferPercentage = getBufferPercentage(videoElement);
      
      // Log buffer progress
      debugLog(`Buffering: ${Math.round(furthestBufferedTime)}s / ${Math.round(duration)}s (${bufferPercentage}%)`);
      
      // Calculate target buffer based on settings
      const targetBufferPercentage = config.bufferPercentage;
      const isBufferEnough = bufferPercentage >= targetBufferPercentage;
      
      // If we have reached our target buffer percentage or have less than 1 second 
      // remaining or have reached max attempts, we're done
      if (isBufferEnough || remainingTime <= 1 || seekAttempts >= config.maxSeekAttempts) {
        successLog(`Buffering complete: ${bufferPercentage}% buffered (target: ${targetBufferPercentage}%)`);
        stopBuffering();
        return;
      }
      
      // Calculate next seek position
      const nextSeekPosition = Math.min(furthestBufferedTime + config.seekStepSize, duration - 0.1);
      
      // Advanced handling for DASH format
      // Store current position
      const currentPosition = videoElement.currentTime;
      
      // Seek ahead to force buffer
      videoElement.currentTime = nextSeekPosition;
      
      // Wait briefly for buffering to start
      setTimeout(() => {
        // Return to original position
        videoElement.currentTime = currentPosition;
        seekAttempts++;
      }, 150);
    } catch (error) {
      errorLog('Error during seek:', error);
      stopBuffering();
    }
  };
  
  /**
   * Stops the buffering process and restores original playback state
   */
  const stopBuffering = () => {
    if (!isBuffering) {
      return;
    }
    
    debugLog('Stopping buffer forcing');
    
    try {
      // Restore original state
      if (videoElement) {
        videoElement.currentTime = originalPlaybackTime;
        videoElement.playbackRate = originalPlaybackRate;
      }
      
      // Reset buffering state
      isBuffering = false;
      seekAttempts = 0;
      
      // Notify background script that buffering is complete
      chrome.runtime.sendMessage({
        type: 'BUFFER_STATUS',
        data: { status: 'complete' }
      }).catch(error => {
        console.error('Error sending buffer complete message:', error);
      });
      
      // Add success log when we finish buffering
      successLog('Buffering finished');
    } catch (error) {
      errorLog('Error stopping buffer:', error);
    }
  };
  
  /**
   * Monitors the video for both buffering and loading issues
   */
  const monitorVideoState = () => {
    if (!videoElement || !config.isEnabled) return;
    
    try {
      // Check if video is stuck in loading state
      if (!isStuckInLoading && isVideoStuckInLoading(videoElement)) {
        debugLog('Video appears to be stuck in loading state');
        isStuckInLoading = true;
        loadingFixAttempts = 0;
        fixStuckLoadingVideo(videoElement);
      }
      
      // If video is playing normally now, reset the loading detection
      if (isStuckInLoading && videoElement.readyState >= 3 && videoElement.currentTime > 0.5) {
        debugLog('Video recovered from loading state');
        isStuckInLoading = false;
        loadingFixAttempts = 0;
        lastProgressTime = 0;
        if (loadingFixTimer) {
          clearTimeout(loadingFixTimer);
          loadingFixTimer = null;
        }
      }
      
      // Check if video needs buffer forcing
      if (!isStuckInLoading) {
        if (config.autoPauseEnabled) {
          // If buffer percentage is below target and video is playing, consider pausing
          const bufferPercentage = getBufferPercentage(videoElement);
          const isBufferLow = bufferPercentage < config.bufferPercentage;
          
          if (isBufferLow && !videoElement.paused && !isBuffering) {
            warningLog(`Buffer low (${bufferPercentage}%), forcing buffer`);
            forceBuffering();
          } else if (!isVideoFullyBuffered(videoElement) && !isBuffering) {
            forceBuffering();
          } else if (isBuffering) {
            // Continue buffering process
            forceBuffering();
          }
        } else if (!isVideoFullyBuffered(videoElement)) {
          forceBuffering();
        } else if (isBuffering) {
          stopBuffering();
        }
      }
      
      // Update lastProgressTime when the video makes progress
      if (videoElement.readyState > 1 && videoElement.currentTime > 0) {
        lastProgressTime = Date.now();
      }
    } catch (error) {
      errorLog('Error in video monitoring:', error);
    }
  };
  
  /**
   * Starts monitoring the video buffer
   */
  const startBufferMonitoring = (video) => {
    if (!video || bufferCheckInterval || !config.isEnabled) {
      return;
    }
    
    videoElement = video;
    debugLog('Starting video monitoring');
    monitoringActive = true;
    
    try {
      // Add event listeners to detect stalled/waiting states
      video.addEventListener('waiting', () => {
        debugLog('Video entered waiting state');
        lastProgressTime = Date.now();
      });
      
      video.addEventListener('playing', () => {
        debugLog('Video started playing');
        lastProgressTime = Date.now();
      });
      
      video.addEventListener('stalled', () => {
        debugLog('Video stalled');
      });
      
      video.addEventListener('error', (e) => {
        const errorCode = e.target.error ? e.target.error.code : 'unknown';
        errorLog(`Video error: ${errorCode}`);
      });
      
      // Start the monitoring interval
      bufferCheckInterval = setInterval(monitorVideoState, config.checkInterval);
      
      // Get video info
      const videoId = new URLSearchParams(window.location.search).get('v');
      successLog(`Monitoring started for video ID: ${videoId || 'unknown'}`);
      
    } catch (error) {
      errorLog('Error starting video monitoring:', error);
    }
  };
  
  /**
   * Stops monitoring the video buffer
   */
  const stopBufferMonitoring = () => {
    if (!monitoringActive) return;
    
    try {
      if (bufferCheckInterval) {
        clearInterval(bufferCheckInterval);
        bufferCheckInterval = null;
      }
      
      if (loadingFixTimer) {
        clearTimeout(loadingFixTimer);
        loadingFixTimer = null;
      }
      
      if (isBuffering) {
        stopBuffering();
      }
      
      if (videoElement) {
        // Remove event listeners
        videoElement.removeEventListener('waiting', () => {});
        videoElement.removeEventListener('playing', () => {});
        videoElement.removeEventListener('stalled', () => {});
        videoElement.removeEventListener('error', () => {});
      }
      
      // Reset all state variables
      videoElement = null;
      isStuckInLoading = false;
      loadingFixAttempts = 0;
      lastProgressTime = 0;
      monitoringActive = false;
      
      debugLog('Stopped video monitoring');
    } catch (error) {
      errorLog('Error stopping video monitoring:', error);
    }
  };
  
  /**
   * Handles settings updates from the extension
   */
  const handleSettingsUpdate = (settings) => {
    try {
      // Update config with new settings
      if (settings.isEnabled !== undefined) config.isEnabled = settings.isEnabled;
      if (settings.debugMode !== undefined) config.debugMode = settings.debugMode;
      if (settings.bufferTimeout !== undefined) config.loadingTimeoutSecs = settings.bufferTimeout;
      if (settings.bufferPercentage !== undefined) config.bufferPercentage = settings.bufferPercentage;
      if (settings.autoPauseEnabled !== undefined) config.autoPauseEnabled = settings.autoPauseEnabled;
      
      debugLog(`Settings updated: enabled=${config.isEnabled}, debug=${config.debugMode}, buffer=${config.bufferPercentage}%`);
      
      // If extension was disabled, stop monitoring
      if (!config.isEnabled && monitoringActive) {
        stopBufferMonitoring();
        debugLog('Extension disabled, monitoring stopped');
      }
      // If extension was enabled and we're on a video page, start monitoring
      else if (config.isEnabled && !monitoringActive && window.location.href.includes('youtube.com/watch')) {
        const video = document.querySelector('video');
        if (video) {
          startBufferMonitoring(video);
          debugLog('Extension enabled, monitoring started');
        }
      }
    } catch (error) {
      errorLog('Error handling settings update:', error);
    }
  };
  
  /**
   * Sets up a mutation observer to detect when video elements are added or removed
   */
  const setupVideoObserver = () => {
    debugLog('Setting up video observer');
    
    try {
      // First, check if there's already a video element
      const existingVideo = document.querySelector('video');
      if (existingVideo && config.isEnabled) {
        startBufferMonitoring(existingVideo);
      }
      
      // Set up mutation observer to detect when videos are added or changed
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          try {
            // Check for added nodes
            if (mutation.addedNodes.length > 0 && config.isEnabled) {
              mutation.addedNodes.forEach((node) => {
                // Direct video element
                if (node.nodeName === 'VIDEO') {
                  startBufferMonitoring(node);
                }
                // Video element within added DOM tree
                else if (node.querySelector) {
                  const video = node.querySelector('video');
                  if (video) {
                    startBufferMonitoring(video);
                  }
                }
              });
            }
            
            // Check if our monitored video was removed
            if (videoElement && mutation.removedNodes.length > 0) {
              mutation.removedNodes.forEach((node) => {
                if (node === videoElement || (node.contains && node.contains(videoElement))) {
                  stopBufferMonitoring();
                }
              });
            }
          } catch (error) {
            errorLog('Error in mutation observer:', error);
          }
        });
      });
      
      // Start observing the document
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      
      // Return the observer so it can be disconnected if needed
      return observer;
    } catch (error) {
      errorLog('Error setting up video observer:', error);
      return null;
    }
  };
  
  /**
   * Initializes the extension
   */
  const initialize = () => {
    try {
      debugLog('Initializing YouTube Force Buffer');
      
      // Only run on YouTube video pages
      if (!window.location.href.includes('youtube.com/watch')) {
        return;
      }
      
      // Log the YouTube video ID
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v');
      debugLog(`YouTube video ID detected: ${videoId}`);
      
      // Request settings from background script
      chrome.runtime.sendMessage({
        type: 'GET_SETTINGS',
        data: {}
      }).catch(error => {
        console.error('Error requesting settings:', error);
      });
      
      // Listen for messages from the extension
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SETTINGS_UPDATE') {
          handleSettingsUpdate(message.data);
        }
      });
      
      // Set up video element observer
      const observer = setupVideoObserver();
      
      // Clean up when navigating away
      window.addEventListener('beforeunload', () => {
        debugLog('Page unloading, cleaning up');
        stopBufferMonitoring();
        if (observer) {
          observer.disconnect();
        }
      });
    } catch (error) {
      errorLog('Error initializing extension:', error);
    }
  };
  
  // Start the extension
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
