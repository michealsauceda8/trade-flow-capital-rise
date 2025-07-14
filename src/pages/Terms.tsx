
import React, { useState } from 'react';
import { FileText, Shield, AlertTriangle, Scale, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const TermsAgreement = () => {
  const [isAgreed, setIsAgreed] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAgree = () => {
    if (!isAuthenticated) {
      localStorage.setItem('termsAgreed', 'true');
      navigate('/auth?redirect=apply');
    } else {
      localStorage.setItem('termsAgreed', 'true');
      navigate('/apply');
    }
  };

  return (
    <div className="text-center">
      <div className="inline-flex items-center space-x-3 bg-slate-800/50 rounded-lg p-4 mb-6">
        <input 
          type="checkbox" 
          id="terms-accept" 
          className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
          checked={isAgreed}
          onChange={(e) => setIsAgreed(e.target.checked)}
        />
        <label htmlFor="terms-accept" className="text-slate-300">
          I agree to the Terms & Conditions and confirm I'll never share private keys
        </label>
      </div>
      
      <div className="space-y-4">
        <Button 
          disabled={!isAgreed}
          onClick={handleAgree}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isAuthenticated ? 'Proceed to Application' : 'Login & Apply'}
        </Button>
        <p className="text-slate-400 text-sm">
          Questions about our terms? <a href="/contact" className="text-blue-400 hover:text-blue-300">Contact our legal team</a>
        </p>
      </div>
    </div>
  );
};

const Terms = () => {
  const sections = [
    {
      id: 'eligibility',
      title: 'Eligibility Requirements',
      icon: Users,
      content: [
        'Must be at least 18 years of age',
        'Must have legal capacity to enter into binding agreements',
        'Must not be located in sanctioned jurisdictions',
        'Must possess demonstrable trading experience with crypto assets',
        'Must maintain good standing with no history of fraud or financial misconduct'
      ]
    },
    {
      id: 'funding',
      title: 'Funding Rules & Requirements',
      icon: Scale,
      content: [
        'Proof of funds deposit required: minimum $2,000 USDT or equivalent',
        'Funds must be held in connected wallet for minimum 24 hours',
        'Funding amount based on demonstrated capital and risk assessment',
        'Profit sharing: Trader keeps 80-90% of profits, platform retains 10-20%',
        'Daily profit withdrawals available once minimum threshold met',
        'Maximum daily loss limits apply based on funding tier'
      ]
    },
    {
      id: 'wallet-security',
      title: 'Wallet Security & Disclaimers',
      icon: Lock,
      content: [
        'TradeFlow Capital NEVER requests private keys or recovery phrases',
        'You maintain complete control and ownership of your connected wallet',
        'We only verify wallet ownership through cryptographic message signing',
        'On-chain balance verification performed via public blockchain data',
        'You are solely responsible for wallet security and backup procedures',
        'Any loss of wallet access or funds is trader\'s responsibility'
      ]
    },
    {
      id: 'trading',
      title: 'Trading Terms & Conditions',
      icon: FileText,
      content: [
        'All trading decisions and strategies are trader\'s sole responsibility',
        'Platform provides capital, not trading advice or recommendations',
        'Risk management parameters must be followed at all times',
        'Prohibited activities: account sharing, copy trading, automated bots',
        'Trading must occur on approved exchanges and platforms only',
        'Compliance with all applicable local trading regulations required'
      ]
    },
    {
      id: 'risks',
      title: 'Risk Disclosure',
      icon: AlertTriangle,
      content: [
        'Cryptocurrency trading involves substantial risk of loss',
        'Past performance does not guarantee future results',
        'Market volatility can result in rapid and significant losses',
        'Leverage amplifies both profits and losses',
        'Technical failures, connectivity issues may impact trading',
        'Regulatory changes may affect trading conditions'
      ]
    },
    {
      id: 'termination',
      title: 'Termination & Fraud Prevention',
      icon: Shield,
      content: [
        'Immediate termination for fraudulent activity or misrepresentation',
        'Violation of trading rules results in funding suspension',
        'Platform reserves right to terminate agreement with 30-day notice',
        'Outstanding profits/losses settled upon termination',
        'Trader may terminate agreement with 7-day written notice',
        'All intellectual property and confidential information protected'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms & <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Conditions</span>
            </h1>
            <p className="text-xl text-slate-300 mb-6">
              Please read these terms carefully before applying for funding
            </p>
            <div className="text-sm text-slate-400">
              Last updated: December 2024 | Effective Date: January 1, 2024
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 mb-12">
            <h3 className="text-white font-semibold mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sections.map((section) => (
                <a 
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center space-x-2 text-slate-300 hover:text-blue-400 transition-colors text-sm"
                >
                  <section.icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <div 
                key={section.id}
                id={section.id}
                className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                </div>
                
                <ul className="space-y-4">
                  {section.content.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-300 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Acceptance Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Agreement Acceptance</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <p className="text-slate-300">
                  By clicking "I Agree" and proceeding with the application, you acknowledge that you have read, 
                  understood, and agree to be bound by these Terms & Conditions.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <p className="text-slate-300">
                  You confirm that you will never share private keys, recovery phrases, or any sensitive wallet information 
                  with TradeFlow Capital or any third parties.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <p className="text-slate-300">
                  You understand that cryptocurrency trading involves substantial risk and you are solely responsible 
                  for your trading decisions and outcomes.
                </p>
              </div>
            </div>

            <TermsAgreement />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
