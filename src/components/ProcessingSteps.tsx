
import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2, Brain } from 'lucide-react';
import type { ProcessingStep } from '../types/processing';

interface ProcessingStepsProps {
  steps: ProcessingStep[];
}

interface OcrResult {
  text: string;
  confidence: number;
  error?: string;
}

interface LLMResponse {
  model: string;
  json: any;
  processingTime: number;
  error?: string;
}

interface LLMStepOutput {
  finalResult?: any;
  llmOutputs?: Record<string, LLMResponse>;
}

interface ValidationStepOutput {
  isValid: boolean;
  errors: string[];
}

export const ProcessingSteps = ({ steps }: ProcessingStepsProps) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900">Processing Steps</h2>
      {steps.map((step, index) => (
        <div key={step.id} className={`border rounded-lg p-4 ${getStepColor(step.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {getStepIcon(step.status)}
              <h3 className="font-medium text-gray-900">{step.name}</h3>
            </div>
            {step.processingTime && (
              <span className="text-sm text-gray-500">
                {step.processingTime}ms
              </span>
            )}
          </div>

          {step.output && (
            <div className="mt-3 p-3 bg-white rounded border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Output:</h4>
              {step.name === 'OCR Processing' ? (
                <div className="space-y-3">
                  {Object.entries(step.output as Record<string, OcrResult>).map(([model, result]) => (
                    <div key={model} className="border rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm text-blue-600">{model.toUpperCase()}</span>
                        <span className="text-sm text-gray-500">
                          Confidence: {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                        {result.text}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : step.name.includes('LLM') ? (
                <div className="space-y-4">
                  {/* Show individual LLM outputs if majority voting */}
                  {(step.output as LLMStepOutput).llmOutputs && Object.entries((step.output as LLMStepOutput).llmOutputs!).map(([llm, response]: [string, LLMResponse]) => (
                    <div key={llm} className="border rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-sm text-purple-600">{llm.toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {response.processingTime}ms
                        </span>
                      </div>
                      {response.error ? (
                        <div className="text-red-600 text-sm">{response.error}</div>
                      ) : (
                        <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(response.json, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  
                  {/* Show final result */}
                  <div className="border-2 border-green-200 rounded p-3 bg-green-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm text-green-600">FINAL RESULT</span>
                    </div>
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify((step.output as LLMStepOutput).finalResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : step.name === 'JSON Validation' ? (
                <div>
                  <div className={`text-sm font-medium ${(step.output as ValidationStepOutput).isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {(step.output as ValidationStepOutput).isValid ? 'Valid JSON structure' : 'Invalid JSON structure'}
                  </div>
                  {(step.output as ValidationStepOutput).errors && (step.output as ValidationStepOutput).errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-600">
                      {(step.output as ValidationStepOutput).errors.map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-700">
                  {typeof step.output === 'string' ? step.output : JSON.stringify(step.output)}
                </div>
              )}
            </div>
          )}

          {step.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <h4 className="text-sm font-medium text-red-800 mb-1">Error:</h4>
              <p className="text-sm text-red-700">{step.error}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
