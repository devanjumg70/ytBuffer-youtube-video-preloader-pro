
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Github, Twitter } from "lucide-react";

const Index = () => {
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [debugMode, setDebugMode] = React.useState(false);
  const [bufferTimeout, setBufferTimeout] = React.useState(10);

  const handleSave = () => {
    // In a real implementation, this would save to chrome.storage
    // and communicate with the content script
    console.log('Settings saved:', { isEnabled, debugMode, bufferTimeout });
    // Add a fake success message as this is just a demo UI
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Feature Card 1 */}
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Smart Buffering</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Forces complete video buffering to prevent stuttering and provides smoother playback experience.
            </p>
          </CardContent>
        </Card>

        {/* Feature Card 2 */}
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Loading Fix</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Automatically detects and fixes stuck YouTube videos that won't start playing.
            </p>
          </CardContent>
        </Card>

        {/* Feature Card 3 */}
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Performance Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Optional debug mode to track and optimize video performance in real-time.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings Card */}
      <Card className="w-full max-w-md mb-8">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="extension-toggle" className="text-base font-medium">
              Enable Extension
            </Label>
            <Switch
              id="extension-toggle"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="debug-toggle" className="text-base font-medium">
              Debug Mode
            </Label>
            <Switch
              id="debug-toggle"
              checked={debugMode}
              onCheckedChange={setDebugMode}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buffer-timeout" className="text-base font-medium">
              Loading Timeout (seconds): {bufferTimeout}
            </Label>
            <Slider
              id="buffer-timeout" 
              min={5}
              max={30}
              step={1}
              value={[bufferTimeout]}
              onValueChange={(values) => setBufferTimeout(values[0])}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSave}>
            Save Settings
          </Button>
        </CardFooter>
      </Card>

      {/* How It Works Section */}
      <Card className="w-full max-w-4xl mb-8">
        <CardHeader>
          <CardTitle className="text-xl">How YTBuffer Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2 text-primary">Step 1</h3>
              <p className="text-sm text-gray-600">
                Detects when YouTube videos are loading or stuck in buffering state.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2 text-primary">Step 2</h3>
              <p className="text-sm text-gray-600">
                Applies smart recovery techniques to force complete buffering or fix loading issues.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2 text-primary">Step 3</h3>
              <p className="text-sm text-gray-600">
                Monitors playback to ensure videos play smoothly without interruptions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center mt-auto pt-6 pb-4">
        <p className="text-gray-600 flex items-center justify-center gap-1 mb-2">
          Made with love by <a href="https://twitter.com/anjumg70" className="text-primary hover:underline ml-1">@anjumg70</a>
        </p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="https://github.com/anjumg70" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary transition-colors">
            <Github size={20} />
          </a>
          <a href="https://twitter.com/anjumg70" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary transition-colors">
            <Twitter size={20} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
