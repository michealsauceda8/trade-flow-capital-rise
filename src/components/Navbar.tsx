
import React, { useState } from 'react';
import { Menu, X, Shield, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TradeFlow Capital</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
            <a href="#funding" className="text-slate-300 hover:text-white transition-colors">Funding</a>
            <a href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Login
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6">
              Apply Now
            </Button>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
          <div className="px-4 py-2 space-y-2">
            <a href="#how-it-works" className="block py-2 text-slate-300 hover:text-white transition-colors">How It Works</a>
            <a href="#funding" className="block py-2 text-slate-300 hover:text-white transition-colors">Funding</a>
            <a href="/contact" className="block py-2 text-slate-300 hover:text-white transition-colors">Contact</a>
            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                Login
              </Button>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
