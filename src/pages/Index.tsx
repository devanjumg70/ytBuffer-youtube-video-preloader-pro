
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Github, Twitter, Info, Check, CirclePercent, SlidersHorizontal, ToggleRight } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";

const Index = () => {
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [debugMode, setDebugMode] = React.useState(false);
  const [bufferTimeout, setBufferTimeout] = React.useState(10);
  const [bufferPercentage, setBufferPercentage] = React.useState(25);
  const [autoPauseEnabled, setAutoPauseEnabled] = React.useState(true);
  const [preloadQuality, setPreloadQuality] = React.useState('auto');

  const handleSave = () => {
    // In a real implementation, this would save to chrome.storage
    // and communicate with the content script
    console.log('Settings saved:', { 
      isEnabled, 
      debugMode, 
      bufferTimeout,
      bufferPercentage,
      autoPauseEnabled,
      preloadQuality
    });
    
    // Show toast notification instead of alert
    toast.success("Settings saved successfully!", {
      description: "Your preferences have been updated",
      icon: <Check className="h-4 w-4" />
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
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

      {/* Main Settings Card */}
      <Card className="w-full max-w-md mb-8 hover:shadow-lg transition-all duration-300">
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
            Save Settings
          </Button>
        </CardFooter>
      </Card>

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
