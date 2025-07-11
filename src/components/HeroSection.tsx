
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, DollarSign, TrendingUp } from 'lucide-react';

const HeroSection = () => {
  const [animationValue, setAnimationValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationValue(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-cyan-500 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"></div>
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        {/* Main Headline */}
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Trade with
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"> Our Capital</span>
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Keep Up to <span className="text-yellow-400">90% of Profits</span>
          </h2>
        </div>

        {/* Subheadline */}
        <div className="animate-fade-in delay-300">
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Get funded in 3-7 days—No evaluations, no demo trading. 
            <br className="hidden md:block" />
            Just proof of capital & skill.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="animate-fade-in delay-500 flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 group"
            onClick={() => window.location.href = '/terms'}
          >
            Apply Now – It's Free
            <Zap className="ml-2 h-5 w-5 group-hover:animate-pulse" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-slate-400 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-4 text-lg rounded-xl transition-all duration-300 group"
          >
            How It Works
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Stats Row */}
        <div className="animate-fade-in delay-700 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">5,000+</div>
            <div className="text-slate-300">Traders Funded</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">$50M+</div>
            <div className="text-slate-300">Capital Deployed</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">3-7 days</div>
            <div className="text-slate-300">Avg. Approval Time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
