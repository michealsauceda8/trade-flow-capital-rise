
import React, { useState } from 'react';
import { Wallet, Shield, DollarSign, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: Wallet,
      title: "Connect Wallet",
      description: "Link your Trust Wallet or MetaMask",
      details: "Connect your existing wallet or create a new one. We support all major wallets including Trust Wallet, MetaMask, and Coinbase Wallet.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Verify Ownership",
      description: "Sign a message to prove wallet ownership",
      details: "Simply sign a message to verify you own the wallet. No private keys shared, completely secure.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: DollarSign,
      title: "Show Proof of Funds",
      description: "Hold $2K-$10K+ for 24 hours",
      details: "Deposit funds to your wallet and hold for 24 hours. Higher amounts lead to faster approval and larger funding.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Zap,
      title: "Get Funded",
      description: "Receive capital and start trading",
      details: "Once approved, receive your trading capital directly to your verified wallet. Start trading and keep up to 90% of profits!",
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Get funded in 4 simple steps. No complicated evaluations, no hidden fees.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-20 left-0 w-full h-1 bg-slate-700 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(activeStep + 1) * 25}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-4 gap-8 relative">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`text-center cursor-pointer transition-all duration-300 ${
                    activeStep === index ? 'transform -translate-y-4' : ''
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <div className={`relative w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${step.color} p-1 ${
                    activeStep === index ? 'scale-110 shadow-2xl' : 'scale-100'
                  } transition-all duration-300`}>
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    {activeStep >= index && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-2 transition-all duration-300 ${
                    activeStep === index ? 'text-white' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </h3>
                  
                  <p className={`text-sm transition-all duration-300 ${
                    activeStep === index ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Step Details */}
          <div className="mt-16 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700">
            <h4 className="text-2xl font-bold text-white mb-4">
              Step {activeStep + 1}: {steps[activeStep].title}
            </h4>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              {steps[activeStep].details}
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              {activeStep === 3 ? 'Start Trading' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden space-y-4">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`bg-slate-800/50 backdrop-blur-lg rounded-2xl border transition-all duration-300 ${
                activeStep === index ? 'border-blue-500' : 'border-slate-700'
              }`}
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setActiveStep(activeStep === index ? -1 : index)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} p-1`}>
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="text-slate-400">{step.description}</p>
                  </div>
                  <ArrowRight className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                    activeStep === index ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>
              
              {activeStep === index && (
                <div className="px-6 pb-6">
                  <p className="text-slate-300 leading-relaxed mb-4">
                    {step.details}
                  </p>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    {index === 3 ? 'Start Trading' : 'Continue'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
