
import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isAuthenticated, signOut, user } = useAuth();
  const navigate = useNavigate();

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setIsAdmin(!!data && !error);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, user]);

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
            {isAuthenticated ? (
              <>
                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    onClick={() => navigate('/admin')}
                  >
                    Admin
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={signOut}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => navigate('/wallet-auth')}
                >
                  Sign In
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-slate-400 hover:text-slate-300"
                  onClick={() => navigate('/auth')}
                >
                  Admin
                </Button>
              </>
            )}
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6"
              onClick={() => navigate('/apply')}
            >
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
              {isAuthenticated ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                      onClick={() => navigate('/admin')}
                    >
                      Admin
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                    onClick={signOut}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                    onClick={() => navigate('/wallet-auth')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full text-slate-400 hover:text-slate-300"
                    onClick={() => navigate('/auth')}
                  >
                    Admin
                  </Button>
                </>
              )}
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                onClick={() => navigate('/apply')}
              >
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
