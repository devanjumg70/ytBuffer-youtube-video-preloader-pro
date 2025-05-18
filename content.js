/**
 * YouTube Force Buffer - Content Script
 * Forces complete video buffering on YouTube videos
 */

(function() {
  'use strict';
  
  // Configuration
  const config = {
    checkInterval: 1000,         // How often to check video buffer status (ms)
    seekStepSize: 30,            // How far to seek ahead when forcing buffer (seconds)
    maxSeekAttempts: 100,        // Maximum number of seek attempts
    debugMode: true              // Enable console logging for debugging
  };
  
  let videoElement = null;
  let originalPlaybackRate = 1;
  let originalPlaybackTime = 0;
  let isBuffering = false;
  let seekAttempts = 0;
  let bufferCheckInterval = null;
  
  /**
   * Debug logger that only logs when debug mode is enabled
   */
  const debugLog = (...args) => {
    if (config.debugMode) {
      console.log('[YT Force Buffer]', ...args);
    }
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
   * Forces video buffering by manipulating the playback speed and using seeking
   */
  const forceBuffering = () => {
    if (!videoElement || isVideoFullyBuffered(videoElement) || seekAttempts >= config.maxSeekAttempts) {
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
    }
    
    const duration = videoElement.duration;
    const furthestBufferedTime = getFurthestBufferedTime(videoElement);
    const remainingTime = duration - furthestBufferedTime;
    
    debugLog(`Buffering: ${Math.round(furthestBufferedTime)}s / ${Math.round(duration)}s (${Math.round((furthestBufferedTime/duration)*100)}%)`);
    
    // If we have less than 1 second remaining or have reached max attempts, we're done
    if (remainingTime <= 1 || seekAttempts >= config.maxSeekAttempts) {
      debugLog('Buffering complete or max attempts reached');
      stopBuffering();
      return;
    }
    
    // Calculate next seek position
    const nextSeekPosition = Math.min(furthestBufferedTime + config.seekStepSize, duration - 0.1);
    
    // Advanced handling for DASH format
    try {
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
      debugLog('Error during seek:', error);
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
    
    // Restore original state
    if (videoElement) {
      videoElement.currentTime = originalPlaybackTime;
      videoElement.playbackRate = originalPlaybackRate;
    }
    
    // Reset buffering state
    isBuffering = false;
    seekAttempts = 0;
    
    // Notify background script that buffering is complete
    try {
      chrome.runtime.sendMessage({
        type: 'BUFFER_STATUS',
        data: { status: 'complete' }
      });
    } catch (error) {
      // Ignore errors from disconnected port
    }
  };
  
  /**
   * Starts monitoring the video buffer
   */
  const startBufferMonitoring = (video) => {
    if (!video || bufferCheckInterval) {
      return;
    }
    
    videoElement = video;
    debugLog('Starting buffer monitoring');
    
    bufferCheckInterval = setInterval(() => {
      // Only force buffering when video is playing and not already fully buffered
      if (videoElement && !isVideoFullyBuffered(videoElement)) {
        forceBuffering();
      } else if (isBuffering) {
        stopBuffering();
      }
    }, config.checkInterval);
  };
  
  /**
   * Stops monitoring the video buffer
   */
  const stopBufferMonitoring = () => {
    if (bufferCheckInterval) {
      clearInterval(bufferCheckInterval);
      bufferCheckInterval = null;
    }
    
    if (isBuffering) {
      stopBuffering();
    }
    
    videoElement = null;
    debugLog('Stopped buffer monitoring');
  };
  
  /**
   * Sets up a mutation observer to detect when video elements are added or removed
   */
  const setupVideoObserver = () => {
    debugLog('Setting up video observer');
    
    // First, check if there's already a video element
    const existingVideo = document.querySelector('video');
    if (existingVideo) {
      startBufferMonitoring(existingVideo);
    }
    
    // Set up mutation observer to detect when videos are added or changed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check for added nodes
        if (mutation.addedNodes.length > 0) {
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
      });
    });
    
    // Start observing the document
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    // Return the observer so it can be disconnected if needed
    return observer;
  };
  
  /**
   * Initializes the extension
   */
  const initialize = () => {
    debugLog('Initializing YouTube Force Buffer');
    
    // Only run on YouTube video pages
    if (!window.location.href.includes('youtube.com/watch')) {
      return;
    }
    
    // Set up video element observer
    const observer = setupVideoObserver();
    
    // Clean up when navigating away
    window.addEventListener('beforeunload', () => {
      stopBufferMonitoring();
      if (observer) {
        observer.disconnect();
      }
    });
  };
  
  // Start the extension
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
