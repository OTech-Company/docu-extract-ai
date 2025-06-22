
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Brain, Vote } from 'lucide-react';

interface LLMSelectorProps {
  selectedMode: 'single' | 'majority';
  onModeChange: (mode: 'single' | 'majority') => void;
}

export const LLMSelector = ({ selectedMode, onModeChange }: LLMSelectorProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>LLM Processing Mode</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMode} onValueChange={onModeChange} className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="single" id="single" />
            <Label htmlFor="single" className="flex-1 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Single LLM Processing</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Send OCR text directly to Gemini API for JSON extraction
              </p>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="majority" id="majority" />
            <Label htmlFor="majority" className="flex-1 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Vote className="w-4 h-4 text-green-600" />
                <span className="font-medium">3-LLM Majority Voting</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Send OCR text to Gemini, Groq, and Qwen APIs, then use Gemini for majority voting
              </p>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
