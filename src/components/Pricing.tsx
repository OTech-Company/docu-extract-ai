
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Star } from 'lucide-react';

export const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      price: '29',
      period: 'month',
      description: 'Perfect for small businesses and freelancers',
      features: [
        '1,000 documents/month',
        'Basic OCR accuracy',
        'Email support',
        'Standard processing speed',
        'JSON export',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      price: '99',
      period: 'month',
      description: 'Ideal for growing teams and businesses',
      features: [
        '10,000 documents/month',
        'Advanced AI accuracy',
        'Priority support',
        'Fast processing',
        'Multiple export formats',
        'API access',
        'Custom workflows',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with custom needs',
      features: [
        'Unlimited documents',
        'Highest accuracy AI',
        'Dedicated support',
        'Fastest processing',
        'All export formats',
        'Full API access',
        'Custom integrations',
        'On-premise deployment',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include our core AI extraction 
            technology with 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                plan.popular
                  ? 'border-blue-600 scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};
