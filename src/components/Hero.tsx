
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { DocumentExtractor } from './DocumentExtractor';

export const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-20 pb-32">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-blue-600/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-blue-600">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  AI-Powered Document Processing
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Extract Data from
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}Any Document
                </span>
                <br />in Seconds
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your document processing workflow with our advanced AI. 
                Extract structured data from invoices, receipts, contracts, and more 
                with 99% accuracy in multiple languages.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                Try Demo Below
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-gray-300 hover:bg-gray-50">
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>50+ Languages</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>99% Accuracy</span>
              </div>
            </div>
          </div>

          {/* Right Content - Document Extractor Demo */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl transform rotate-3" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              <DocumentExtractor />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
