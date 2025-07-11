
import React from 'react';
import { TrendingUp, Twitter, MessageCircle, Mail, Shield, FileText } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TradeFlow Capital</span>
            </div>
            <p className="text-slate-300 mb-6 max-w-md leading-relaxed">
              Empowering traders worldwide with instant funding. Trade with our capital, keep up to 90% of profits, and scale your trading career without limits.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#funding" className="text-slate-300 hover:text-white transition-colors">Funding</a></li>
              <li><a href="/apply" className="text-slate-300 hover:text-white transition-colors">Apply Now</a></li>
              <li><a href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="/terms" className="text-slate-300 hover:text-white transition-colors flex items-center"><FileText className="h-4 w-4 mr-2" />Terms & Conditions</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors flex items-center"><Shield className="h-4 w-4 mr-2" />Privacy Policy</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Risk Disclosure</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Compliance</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © 2024 TradeFlow Capital. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Secured & Insured</span>
            </div>
            <div className="text-slate-400 text-sm">
              Avg. response time: 12 minutes
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
