import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Github, Twitter, Info, Check, CirclePercent, SlidersHorizontal, ToggleRight, FileText, AlertTriangle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

// Check if we're in a browser extension environment
const isExtensionEnvironment = typeof chrome !== 'undefined' && 
                              chrome.runtime && 
                              chrome.runtime.sendMessage;

// Define log type for TypeScript
interface ConsoleLog {
  time: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

const Index = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [debugMode, setDebugMode] = useState(true);
  const [bufferTimeout, setBufferTimeout] = useState(10);
  const [bufferPercentage, setBufferPercentage] = useState(25);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(true);
  const [preloadQuality, setPreloadQuality] = useState('auto');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to handle messages from content scripts
    const handleMessage = (message: any) => {
      try {
        if (message.type === 'LOG_MESSAGE') {
          setConsoleLogs(logs => [
            ...logs, 
            {
              time: new Date().toLocaleTimeString(),
              message: message.data.message,
              type: message.data.logType || 'info'
            }
          ]);
        } else if (message.type === 'BUFFER_STATUS') {
          const status = message.data.status;
          if (status === 'complete') {
            addSuccessLog(`Buffering complete for video`);
          } else if (status === 'started') {
            addInfoLog(`Buffering started for video`);
          }
        } else if (message.type === 'LOADING_FIX') {
          const attempt = message.data.attempt;
          const max = message.data.max;
          addWarningLog(`Loading fix attempt ${attempt} of ${max}`);
        }
      } catch (err) {
        setError(`Error processing message: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Error handling message:', err);
      }
    };

    // Add listener for messages from content script
    if (isExtensionEnvironment) {
      try {
        chrome.runtime.onMessage.addListener(handleMessage);
        
        // Initial loading of settings
        loadSettings();

        // Add a welcome message
        addInfoLog('Extension initialized and ready');
      } catch (err) {
        console.error('Failed to set up Chrome message listener:', err);
        setError(`Extension error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // Development mode: Add initial log
      addInfoLog('Running in development mode. Connect to YouTube to see actual logs.');
    }

    return () => {
      if (isExtensionEnvironment) {
        try {
          chrome.runtime.onMessage.removeListener(handleMessage);
        } catch (err) {
          console.error('Failed to remove message listener:', err);
        }
      }
    };
  }, []);

  // Helper functions to add typed logs
  const addInfoLog = (message: string) => {
    setConsoleLogs(logs => [
      ...logs,
      {
        time: new Date().toLocaleTimeString(),
        message,
        type: 'info'
      }
    ]);
  };

  const addWarningLog = (message: string) => {
    setConsoleLogs(logs => [
      ...logs,
      {
        time: new Date().toLocaleTimeString(),
        message,
        type: 'warning'
      }
    ]);
  };

  const addErrorLog = (message: string) => {
    setConsoleLogs(logs => [
      ...logs,
      {
        time: new Date().toLocaleTimeString(),
        message,
        type: 'error'
      }
    ]);
  };

  const addSuccessLog = (message: string) => {
    setConsoleLogs(logs => [
      ...logs,
      {
        time: new Date().toLocaleTimeString(),
        message,
        type: 'success'
      }
    ]);
  };

  // Load settings from Chrome storage
  const loadSettings = () => {
    if (!isExtensionEnvironment) return;
    
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
          addErrorLog(`Failed to load settings: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        // Update state with saved settings or keep defaults
        setIsEnabled(result.isEnabled !== undefined ? result.isEnabled : true);
        setDebugMode(result.debugMode !== undefined ? result.debugMode : true);
        setBufferTimeout(result.bufferTimeout !== undefined ? result.bufferTimeout : 10);
        setBufferPercentage(result.bufferPercentage !== undefined ? result.bufferPercentage : 25);
        setAutoPauseEnabled(result.autoPauseEnabled !== undefined ? result.autoPauseEnabled : true);
        setPreloadQuality(result.preloadQuality !== undefined ? result.preloadQuality : 'auto');
        
        addInfoLog('Settings loaded successfully');
      });
    } catch (err) {
      console.error('Error loading settings:', err);
      addErrorLog(`Failed to load settings: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSave = () => {
    if (!isExtensionEnvironment) {
      toast.warning("Running in development mode. Settings cannot be saved.", {
        description: "Connect to a real Chrome extension to save settings",
        icon: <AlertTriangle className="h-4 w-4" />
      });
      return;
    }
    
    const settings = { 
      isEnabled, 
      debugMode, 
      bufferTimeout,
      bufferPercentage,
      autoPauseEnabled,
      preloadQuality
    };
    
    try {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          toast.error(`Failed to save settings: ${chrome.runtime.lastError.message}`, {
            icon: <AlertTriangle className="h-4 w-4" />
          });
          addErrorLog(`Save failed: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        // Show toast notification
        toast.success("Settings saved successfully!", {
          description: "Your preferences have been updated",
          icon: <Check className="h-4 w-4" />
        });
        
        setSettingsSaved(true);
        addSuccessLog('Settings saved successfully');
        
        // Send settings to content scripts
        sendSettingsToActiveTab(settings);
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(`Error saving settings: ${err instanceof Error ? err.message : String(err)}`, {
        icon: <AlertTriangle className="h-4 w-4" />
      });
      addErrorLog(`Error saving settings: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Send settings to active tabs to update in real-time
  const sendSettingsToActiveTab = (settings: any) => {
    if (!isExtensionEnvironment) return;
    
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError);
          return;
        }
        
        tabs.forEach(tab => {
          if (tab.id && tab.url?.includes('youtube.com')) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'UPDATE_SETTINGS',
              data: settings
            }).catch(err => {
              console.error('Error sending message to tab:', err);
            });
          }
        });
      });
    } catch (err) {
      console.error('Error sending settings to tabs:', err);
    }
  };

  const clearLogs = () => {
    setConsoleLogs([]);
    toast.success("Logs cleared", {
      icon: <Check className="h-4 w-4" />
    });
  };

  // If there was an error initializing the extension, show it
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Extension Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-4 text-sm text-gray-500">
              Try reloading the extension or check the browser console for more information.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Reload Extension
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
        {/* Feature Cards */}
        {/* Feature Card 1 */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CirclePercent className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Smart Buffering</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Forces complete video buffering to prevent stuttering and provides smoother playback experience.
            </p>
          </CardContent>
        </Card>

        {/* Feature Card 2 */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ToggleRight className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Loading Fix</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Automatically detects and fixes stuck YouTube videos that won't start playing.
            </p>
          </CardContent>
        </Card>

        {/* Feature Card 3 */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Performance Monitor</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Optional debug mode to track and optimize video performance in real-time.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Main Settings Card */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">YTBuffer</CardTitle>
              <Badge variant="outline" className="ml-2">v1.0.0</Badge>
            </div>
            <CardDescription>
              Forces complete video buffering on YouTube videos and fixes stuck loading videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Settings Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Basic Settings</h3>
              
              <div className="flex items-center justify-between group">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="extension-toggle" className="text-base font-medium group-hover:text-primary transition-colors">
                          Enable Extension
                        </Label>
                        <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Turn the extension on or off globally</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Switch
                  id="extension-toggle"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              
              <div className="flex items-center justify-between group">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="debug-toggle" className="text-base font-medium group-hover:text-primary transition-colors">
                          Debug Mode
                        </Label>
                        <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Shows performance metrics and logs in the console</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Switch
                  id="debug-toggle"
                  checked={debugMode}
                  onCheckedChange={setDebugMode}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            {/* Advanced Buffering Settings Section */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider pt-2">Advanced Buffering</h3>
              
              <div className="space-y-2 group">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="buffer-timeout" className="text-base font-medium group-hover:text-primary transition-colors">
                          Loading Timeout (seconds): {bufferTimeout}
                        </Label>
                        <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum time to wait before attempting to fix a stuck video</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Slider
                  id="buffer-timeout" 
                  min={5}
                  max={30}
                  step={1}
                  value={[bufferTimeout]}
                  onValueChange={(values) => setBufferTimeout(values[0])}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="space-y-2 group">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="buffer-percentage" className="text-base font-medium group-hover:text-primary transition-colors">
                          Buffer Percentage: {bufferPercentage}%
                        </Label>
                        <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of video to buffer ahead before playing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Slider
                  id="buffer-percentage" 
                  min={5}
                  max={50}
                  step={5}
                  value={[bufferPercentage]}
                  onValueChange={(values) => setBufferPercentage(values[0])}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="flex items-center justify-between group">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="autopause-toggle" className="text-base font-medium group-hover:text-primary transition-colors">
                          Auto-Pause on Low Buffer
                        </Label>
                        <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Automatically pause video when buffer runs low</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Switch
                  id="autopause-toggle"
                  checked={autoPauseEnabled}
                  onCheckedChange={setAutoPauseEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              
              <div className="flex items-center justify-between group">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="quality-select" className="text-base font-medium group-hover:text-primary transition-colors">
                          Preload Quality
                        </Label>
                        <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Quality level to use during initial buffering</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <select 
                  id="quality-select"
                  value={preloadQuality}
                  onChange={(e) => setPreloadQuality(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full hover:bg-primary/90 transition-colors" 
              onClick={handleSave}
            >
              {settingsSaved ? "Settings Saved" : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>

        {/* Console Logs Card */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Real-time Console Logs</CardTitle>
              </div>
              <Badge variant="outline" className="ml-2">{consoleLogs.length} entries</Badge>
            </div>
            <CardDescription>
              View live logs from your YouTube videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded border p-4">
              {consoleLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 italic">
                  No logs yet. Play a YouTube video to see logs appear here.
                </div>
              ) : (
                <div className="space-y-2">
                  {consoleLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded-md animate-fade-in border-l-4 ${
                        log.type === 'error' ? 'border-red-400 bg-red-50' :
                        log.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                        log.type === 'success' ? 'border-green-400 bg-green-50' :
                        'border-blue-400 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{log.time}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          log.type === 'error' ? 'bg-red-200 text-red-800' :
                          log.type === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                          log.type === 'success' ? 'bg-green-200 text-green-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline"
              className="w-full hover:bg-gray-100 transition-colors" 
              onClick={clearLogs}
              disabled={consoleLogs.length === 0}
            >
              Clear Logs
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* How It Works Section */}
      <Card className="w-full max-w-4xl mb-8 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl">How YTBuffer Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300">
              <h3 className="font-medium mb-2 text-primary">Step 1</h3>
              <p className="text-sm text-gray-600">
                Detects when YouTube videos are loading or stuck in buffering state.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300">
              <h3 className="font-medium mb-2 text-primary">Step 2</h3>
              <p className="text-sm text-gray-600">
                Applies smart recovery techniques to force complete buffering or fix loading issues.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300">
              <h3 className="font-medium mb-2 text-primary">Step 3</h3>
              <p className="text-sm text-gray-600">
                Monitors playback to ensure videos play smoothly without interruptions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center mt-auto pt-6 pb-4 animate-fade-in">
        <p className="text-gray-600 flex items-center justify-center gap-1 mb-2">
          Made with love by <a href="https://twitter.com/anjumg70" className="text-primary hover:underline ml-1 hover:text-primary/80 transition-colors">@anjumg70</a>
        </p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="https://github.com/anjumg70" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary transition-colors hover:scale-110 transform">
            <Github size={20} />
          </a>
          <a href="https://twitter.com/anjumg70" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary transition-colors hover:scale-110 transform">
            <Twitter size={20} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
