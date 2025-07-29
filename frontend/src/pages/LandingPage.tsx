import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Bookmark, 
  Search, 
  Share2, 
  Zap, 
  Shield, 
  Sparkles,
  Mail,
  Lock,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';

interface AuthFormData {
  email: string;
  password: string;
}

export const LandingPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const { login, register, adminLogin, user } = useAuth();
  const navigate = useNavigate();

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AuthFormData>();

  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isAdminLogin) {
        await adminLogin(data.email, data.password);
        reset();
        navigate('/admin'); // Redirect admin to admin panel
      } else if (isLogin) {
        await login(data.email, data.password);
        reset();
        navigate('/dashboard'); // Redirect normal user to dashboard
      } else {
        await register(data.email, data.password);
        reset();
        setIsLogin(true);
      }
    } catch (error) {
      // Error handling is assumed inside useAuth with toast notifications
    }
  };

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Smart Search",
      description: "AI-powered search finds exactly what you're looking for using semantic understanding."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Auto-Tagging",
      description: "Machine learning automatically categorizes and tags your bookmarks for better organization."
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Easy Sharing",
      description: "Create shareable collections of your favorite resources with a single click."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your data is encrypted and secure. Only you control what gets shared."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center space-x-2 mb-6">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center"
                >
                  <Bookmark className="w-7 h-7 text-white" />
                </motion.div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  ResourceNest
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
              >
                Your
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  {" "}Smart{" "}
                </span>
                Bookmark Manager
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
              >
                Transform how you save and discover content. AI-powered organization, 
                lightning-fast search, and seamless sharing - all in one beautiful interface.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <Zap className="w-5 h-5 text-primary-600" />
                  <span>Instant Search</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <Sparkles className="w-5 h-5 text-secondary-600" />
                  <span>AI Tagging</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <Share2 className="w-5 h-5 text-accent-600" />
                  <span>Easy Sharing</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Auth Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Card className="p-8 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isAdminLogin ? 'Admin Access' : isLogin ? 'Welcome Back' : 'Get Started'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isAdminLogin 
                      ? 'Sign in with admin credentials' 
                      : isLogin 
                        ? 'Sign in to your account' 
                        : 'Create your free account'
                    }
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    icon={<Mail className="w-4 h-4" />}
                    {...registerForm('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    error={errors.email?.message}
                    placeholder="Enter your email"
                  />

                  <Input
                    label="Password"
                    type="password"
                    icon={<Lock className="w-4 h-4" />}
                    {...registerForm('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    error={errors.password?.message}
                    placeholder="Enter your password"
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={isSubmitting}
                  >
                    {isAdminLogin ? (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Sign In
                      </>
                    ) : isLogin ? (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setIsAdminLogin(false);
                        reset();
                      }}
                      className="ml-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminLogin(!isAdminLogin);
                        setIsLogin(true);
                        reset();
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {isAdminLogin ? 'Regular login' : 'Admin login'}
                    </button>
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to organize, discover, and share your favorite resources
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="p-6 text-center h-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
