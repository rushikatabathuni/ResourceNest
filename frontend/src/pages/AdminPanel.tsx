import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Bookmark, 
  Tag, 
  TrendingUp, 
  BarChart3,
  Activity,
  Globe,
  Calendar,
  Shield,
  Database
} from 'lucide-react';
import { apiService } from '../services/api';
import { Analytics } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';

export const AdminPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.total_users.toLocaleString(),
      icon: <Users className="w-6 h-6" />,
      color: 'bg-primary-100 dark:bg-primary-900 text-primary-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Total Bookmarks',
      value: analytics.total_bookmarks.toLocaleString(),
      icon: <Bookmark className="w-6 h-6" />,
      color: 'bg-secondary-100 dark:bg-secondary-900 text-secondary-600',
      change: '+24%',
      changeType: 'positive'
    },
    {
      title: 'Popular Tags',
      value: (analytics.top_tags?.length ?? 0).toString(),

      icon: <Tag className="w-6 h-6" />,
      color: 'bg-accent-100 dark:bg-accent-900 text-accent-600',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Active Categories',
      value: (analytics.top_categories?.length ?? 0).toString(),

      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-green-100 dark:bg-green-900 text-green-600',
      change: '+8%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                System overview and analytics
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((stat, index) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2 space-x-1">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      vs last month
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Charts and Data */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Tag className="w-5 h-5 text-primary-600" />
                <span>Most Popular Tags</span>
              </h2>
              {Array.isArray(analytics?.top_tags) && analytics.top_tags.length > 0 ? (
                <div className="space-y-4">
                  {analytics.top_tags.slice(0, 10).map((tag, index) => (
                    <div key={tag._id || tag} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <Badge variant="secondary">{tag._id || tag}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {tag.count ?? 0}
                        </span>
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                analytics.top_tags.length > 0
                                  ? (tag.count / Math.max(...analytics.top_tags.map(t => t.count || 1))) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No tags data available yet
                  </p>
                </div>
              )}

            </Card>
          </motion.div>

          {/* Top Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-secondary-600" />
                <span>Top Categories</span>
              </h2>
              {analytics.top_categories?.length ?? 0 > 0 ? (
                <div className="space-y-4">
                  {analytics.top_categories.slice(0, 10).map((category, index) => (
                    <div key={category._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-secondary-100 dark:bg-secondary-900 text-secondary-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <Badge variant="default">{category._id}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {category.count}
                        </span>
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary-500 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(category.count / Math.max(...analytics.top_categories.map(c => c.count))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No categories data available yet
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span>System Status</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">API Status</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Database</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Connected</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">ML Models</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loaded</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};