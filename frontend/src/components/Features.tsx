
import React from 'react';
import { 
  Zap, 
  Globe, 
  Shield, 
  Code, 
  BarChart3, 
  Clock,
  FileText,
  Smartphone
} from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process documents in under 3 seconds with our optimized AI pipeline',
    },
    {
      icon: Globe,
      title: '50+ Languages',
      description: 'Support for documents in over 50 languages with high accuracy',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'SOC 2 Type II compliant with end-to-end encryption',
    },
    {
      icon: Code,
      title: 'Developer API',
      description: 'RESTful API with comprehensive documentation and SDKs',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track processing metrics and extraction accuracy in real-time',
    },
    {
      icon: Clock,
      title: '24/7 Processing',
      description: 'Round-the-clock document processing with 99.9% uptime',
    },
    {
      icon: FileText,
      title: 'Multiple Formats',
      description: 'Support for PDF, images, scanned documents, and more',
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Capture and process documents directly from mobile devices',
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Document Processing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive features designed to handle any document processing workflow, 
            from small businesses to enterprise operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
