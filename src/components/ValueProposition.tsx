
import React from 'react';
import { CheckCircle, Clock, DollarSign, Shield, Zap, TrendingUp } from 'lucide-react';

const ValueProposition = () => {
  const features = [
    {
      icon: CheckCircle,
      title: "No Evaluation Fees",
      description: "Skip the challenges—just prove you're a real trader.",
      color: "text-green-400"
    },
    {
      icon: Clock,
      title: "Fast Funding (3-7 days)",
      description: "Professional evaluation process ensures quality partnerships.",
      color: "text-blue-400"
    },
    {
      icon: DollarSign,
      title: "Keep 80-90% of Profits",
      description: "We take only a small share—you earn the rest.",
      color: "text-yellow-400"
    }
  ];

  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">TradeFlow</span>?
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            We've revolutionized trader funding by removing barriers and focusing on what matters: your real trading capital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} bg-slate-800 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-slate-300 text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-20 text-center">
          <p className="text-slate-400 mb-8 text-lg">Trusted by traders worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-green-400" />
              <span className="text-slate-300 font-semibold">Secured by Fireblocks</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-yellow-400" />
              <span className="text-slate-300 font-semibold">Partnered with Binance</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              <span className="text-slate-300 font-semibold">Backed by OKX</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
