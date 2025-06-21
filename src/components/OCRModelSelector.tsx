
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OCRModel } from '../types/processing';

interface OCRModelSelectorProps {
  models: OCRModel[];
  selectedModels: string[];
  onSelectionChange: (selectedModels: string[]) => void;
}

export const OCRModelSelector = ({ models, selectedModels, onSelectionChange }: OCRModelSelectorProps) => {
  const handleModelToggle = (modelName: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedModels, modelName]);
    } else {
      onSelectionChange(selectedModels.filter(m => m !== modelName));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select OCR Models</CardTitle>
        <p className="text-sm text-gray-600">
          Choose which OCR models to use for text extraction. Multiple models will provide comparison results.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <div key={model.name} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={model.name}
                checked={selectedModels.includes(model.name)}
                onCheckedChange={(checked) => handleModelToggle(model.name, checked as boolean)}
                disabled={!model.isActive}
              />
              <div className="flex-1">
                <label htmlFor={model.name} className="font-medium text-sm cursor-pointer">
                  {model.displayName}
                </label>
                <p className="text-xs text-gray-600 mt-1">{model.description}</p>
              </div>
            </div>
          ))}
        </div>
        {selectedModels.length === 0 && (
          <p className="text-sm text-orange-600 mt-4">
            Please select at least one OCR model to proceed.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
