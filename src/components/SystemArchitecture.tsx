
import React from 'react';
import { ArrowRight, Upload, Cpu, Database, Download } from 'lucide-react';

export const SystemArchitecture = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Document Upload',
      description: 'Secure upload of documents in multiple formats',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Cpu,
      title: 'AI Processing',
      description: 'Advanced OCR and LLM analysis for data extraction',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Database,
      title: 'Data Storage',
      description: 'Structured data stored securely in our database',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Download,
      title: 'Export Results',
      description: 'Download or integrate via API in JSON/CSV format',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <section id="architecture" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How Our System Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our advanced pipeline combines cutting-edge OCR technology with Large Language Models 
            to extract structured data from any document with unprecedented accuracy.
          </p>
        </div>

        {/* Architecture Pipeline */}
        <div className="relative">
          {/* Pipeline Background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 via-green-200 to-orange-200"></div>
          </div>

          {/* Pipeline Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-16 h-16 ${step.bgColor} rounded-full flex items-center justify-center mb-4 relative z-10 bg-white border-4 border-white shadow-lg`}>
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  {step.description}
                </p>
                
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 left-1/2 transform translate-x-8 w-6 h-6 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Powered by Advanced AI
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Multi-Modal LLMs</h4>
                  <p className="text-gray-600">Latest Gemini and GPT models for understanding document context</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Advanced OCR</h4>
                  <p className="text-gray-600">State-of-the-art optical character recognition with 99%+ accuracy</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Smart Validation</h4>
                  <p className="text-gray-600">Built-in validation and error correction for reliable results</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="/lovable-uploads/6f351a6d-1ea7-422e-8686-edb89807401e.png"
              alt="System Architecture Diagram"
              className="w-full rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
