
import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { SystemArchitecture } from '../components/SystemArchitecture';
import { Features } from '../components/Features';
import { Footer } from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <Hero />
      <SystemArchitecture />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
