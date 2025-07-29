import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  User, 
  LogOut, 
  Settings, 
  Moon, 
  Sun, 
  BarChart3,
  Home,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center"
            >
              <Bookmark className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ResourceNest
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/collections"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Collections</span>
            </Link>
            {user.is_admin && (
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* User menu */}
            <div className="relative">
              <div className="flex items-center space-x-2">
                <Link to="/settings">
                  <Button variant="ghost" size="sm" className="p-2">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};