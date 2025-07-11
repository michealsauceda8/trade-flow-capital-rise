
import React, { useState } from 'react';
import { Plus, Minus, Shield, Wallet, DollarSign, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openFAQ, setOpenFAQ] = useState(0);

  const faqs = [
    {
      icon: DollarSign,
      question: "Why do I need to deposit funds?",
      answer: "We verify you're a real trader with actual capital, not someone looking to gamble with our money. This protects both parties and ensures serious traders get access to funding.",
      color: "text-yellow-400"
    },
    {
      icon: Shield,
      question: "Is my wallet safe?",
      answer: "Absolutely. We never ask for private keys or recovery phrases. We only verify wallet ownership through message signing and check on-chain balances. Your funds remain 100% under your control.",
      color: "text-green-400"
    },
    {
      icon: Clock,
      question: "How fast can I get funded?",
      answer: "Most applications are approved within 24-48 hours. Larger capital demonstrations (>$5K) typically get faster approval. Once approved, funding is deployed immediately.",
      color: "text-blue-400"
    },
    {
      icon: Wallet,
      question: "Which wallets do you support?",
      answer: "We support all major wallets including Trust Wallet, MetaMask, Coinbase Wallet, and any Web3-compatible wallet. As long as you can sign messages and hold crypto, you're good to go.",
      color: "text-purple-400"
    },
    {
      icon: AlertTriangle,
      question: "What if I lose money?",
      answer: "Trading involves risk, and losses are part of the game. We provide risk management tools and guidelines, but ultimately, your trading decisions are your responsibility. We share both profits and losses.",
      color: "text-orange-400"
    },
    {
      icon: HelpCircle,
      question: "Can I withdraw my profits anytime?",
      answer: "Yes! Profit withdrawals are processed daily. You keep 80-90% of profits depending on your funding tier. There are no hidden fees or withdrawal restrictions.",
      color: "text-cyan-400"
    }
  ];

  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Questions</span>
          </h2>
          <p className="text-xl text-slate-300">
            Get answers to the most common questions about our funding process.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700 overflow-hidden transition-all duration-300 hover:border-slate-600"
            >
              <button
                className="w-full px-8 py-6 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`${faq.color} bg-slate-700 p-2 rounded-lg`}>
                    <faq.icon className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-semibold text-white">{faq.question}</span>
                </div>
                <div className={`transition-transform duration-300 ${openFAQ === index ? 'rotate-180' : ''}`}>
                  {openFAQ === index ? (
                    <Minus className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Plus className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>
              
              {openFAQ === index && (
                <div className="px-8 pb-6 pt-2">
                  <div className="pl-12">
                    <p className="text-slate-300 leading-relaxed text-lg">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
          <p className="text-slate-300 mb-6">Our support team is available 24/7 to help you succeed.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              Contact Support
            </a>
            <a 
              href="#" 
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white font-semibold rounded-xl transition-all duration-300"
            >
              Join Our Telegram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
