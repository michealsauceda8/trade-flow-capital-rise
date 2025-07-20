
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminNotifications } from './AdminNotifications';
import { 
  User, 
  LogOut, 
  Settings, 
  FileText, 
  BarChart3,
  Shield
} from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="text-white font-semibold text-lg">Trading Fund</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/' 
                  ? 'text-blue-400' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/apply" 
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/apply' 
                  ? 'text-blue-400' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Apply
            </Link>
            <Link 
              to="/track" 
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/track' 
                  ? 'text-blue-400' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Track Application
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/contact' 
                  ? 'text-blue-400' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Admin Notifications - only show for admins */}
            {isAuthenticated && isAdmin && <AdminNotifications />}

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* Admin Links */}
                {isAdmin && (
                  <>
                    <Link to="/enhanced-admin">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-slate-300 hover:text-white"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  </>
                )}
                
                {/* User Dashboard */}
                <Link to="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-300 hover:text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                {/* Profile Link */}
                <Link to="/profile">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-300 hover:text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>

                {/* Logout */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-slate-300 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link to="/apply">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Apply Now
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-slate-300 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/apply" 
                className="text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Apply
              </Link>
              <Link 
                to="/track" 
                className="text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Track Application
              </Link>
              <Link 
                to="/contact" 
                className="text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link 
                      to="/enhanced-admin" 
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link 
                    to="/dashboard" 
                    className="text-slate-300 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-slate-300 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-slate-300 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className="text-slate-300 hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
