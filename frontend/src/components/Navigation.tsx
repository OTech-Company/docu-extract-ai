
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Cog, BarChart3 } from 'lucide-react';

export const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: FileText },
    { path: '/extraction', label: 'Document Extraction', icon: FileText },
    { path: '/processing-pipeline', label: 'Processing Pipeline', icon: Cog },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-blue-600">
              DocExtract AI
            </Link>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
