
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">YouTube Force Buffer</CardTitle>
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
    </div>
  );
};

export default Index;
