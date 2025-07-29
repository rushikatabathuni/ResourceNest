import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Moon, 
  Sun, 
  Shield, 
  Trash2, 
  Download,
  Upload,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, logout, token } = useAuth();  // Make sure your context provides token
  const { isDark, toggleTheme } = useTheme();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportData = () => {
    toast.success('Data export will be available soon');
  };

  const handleImportData = () => {
    // Trigger hidden file input click
    fileInputRef.current?.click();
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    console.log("Sending token:", token);  // <-- Log the token here
    console.log("Sending file:", file.name, "size:", file.size, "type:", file.type);
    console.log("Token:", token);


    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/bookmarks/import`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,  // Add auth header
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Import failed');
      }

      const data = await response.json();
      console.log(data);
      toast.success(`Imported ${data.importedCount} bookmarks. Skipped Duplicates: ${data.duplicatesSkipped}. Errors: ${data.errors}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import bookmarks');
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      toast.success('Account deletion will be available soon');
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } else {
      toast.error('Please type "DELETE" to confirm');
    }
  };

  const settingSections = [
    {
      title: 'Account',
      icon: <User className="w-5 h-5" />,
      items: [
        {
          title: 'Email Address',
          description: 'Your registered email address',
          value: user?.email,
          action: null,
        },
        {
          title: 'Account Type',
          description: 'Your current account privileges',
          value: user?.is_admin ? 'Administrator' : 'Standard User',
          action: user?.is_admin ? <Badge variant="success">Admin</Badge> : <Badge variant="default">User</Badge>,
        },
      ],
    },
    {
      title: 'Appearance',
      icon: isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
      items: [
        {
          title: 'Theme',
          description: 'Choose between light and dark mode',
          value: isDark ? 'Dark Mode' : 'Light Mode',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center space-x-2"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Switch to {isDark ? 'Light' : 'Dark'}</span>
            </Button>
          ),
        },
      ],
    },
    {
      title: 'Data & Privacy',
      icon: <Database className="w-5 h-5" />,
      items: [
        {
          title: 'Export Data',
          description: 'Download all your bookmarks and data',
          value: 'JSON format',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          ),
        },
        {
          title: 'Import Data',
          description: 'Import bookmarks from other services',
          value: 'JSON, CSV, Browser exports',
          action: (
            <>
              <input
                type="file"
                accept=".html,.json,.csv,text/html,application/json,text/csv"
                onChange={onFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportData}
                className="flex items-center space-x-2"
                disabled={importLoading}
              >
                <Upload className="w-4 h-4" />
                <span>{importLoading ? 'Importing...' : 'Import'}</span>
              </Button>
            </>
          ),
        },
      ],
    },
    {
      title: 'Security',
      icon: <Shield className="w-5 h-5" />,
      items: [
        {
          title: 'Sign Out',
          description: 'Sign out from all devices',
          value: 'Current session active',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
            >
              Sign Out
            </Button>
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account, preferences, and data
          </p>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center text-primary-600">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.description}
                        </p>
                        {item.value && typeof item.value === 'string' && !item.action && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                            {item.value}
                          </p>
                        )}
                      </div>
                      {item.action && (
                        <div className="ml-4">
                          {item.action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center text-red-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-red-900 dark:text-red-200">
                  Danger Zone
                </h2>
              </div>

              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-red-900 dark:text-red-200">
                      Delete Account
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">
                      Confirm Account Deletion
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      This action will permanently delete your account and all your bookmarks. 
                      To confirm, type <strong>DELETE</strong> in the field below.
                    </p>
                    <Input
                      placeholder="Type DELETE to confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="border-red-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE'}
                    >
                      Confirm Deletion
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
