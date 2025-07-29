import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Plus,
  Bookmark,
  Tag,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Bookmark as BookmarkType } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BookmarkCard } from '../components/bookmarks/BookmarkCard';
import { BookmarkForm } from '../components/bookmarks/BookmarkForm';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookmarkType[]>([]);
  const [recentBookmarks, setRecentBookmarks] = useState<BookmarkType[]>([]);
  const [stats, setStats] = useState({
    totalBookmarks: 0,
    topTags: [] as string[],
    recentActivity: 0
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [brokenCount, setBrokenCount] = useState(0);
  const [brokenBookmarks, setBrokenBookmarks] = useState<BookmarkType[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadBrokenBookmarks();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const bookmarks = await apiService.getBookmarks();

      const totalBookmarks = bookmarks.length;

      const tags = bookmarks.reduce((acc: Record<string, number>, bookmark: BookmarkType) => {
        bookmark.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {});

      const topTags = Object.entries(tags)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      const recent = bookmarks
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalBookmarks,
        topTags,
        recentActivity: recent.length
      });
      setRecentBookmarks(recent);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBrokenBookmarks = async () => {
    try {
      const response = await apiService.getBrokenBookmarks();
      setBrokenCount(response.count);
      setBrokenBookmarks(response.bookmarks);
    } catch {
      toast.error("Failed to load broken bookmarks");
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setFilterTag(null);
      return;
    }
    try {
      setIsSearching(true);
      const results = await apiService.searchBookmarks(query);
      setSearchResults(results);
      setFilterTag(null);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleAddBookmark = async (data: any) => {
    try {
      await apiService.addBookmark(data);
      toast.success('Bookmark added!');
      loadDashboardData();
      loadBrokenBookmarks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add bookmark');
    }
  };

  const handleEditBookmark = async (bookmark: BookmarkType) => {
    toast('Edit UI not yet implemented');
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await apiService.deleteBookmark(id);
      toast.success('Bookmark deleted');
      loadDashboardData();
      loadBrokenBookmarks();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleShareBookmark = async (id: string) => {
    try {
      const response = await apiService.shareBookmarks([id]);
      const shareUrl = `${window.location.origin}/shared/${response.share_id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    } catch {
      toast.error('Share failed');
    }
  };

  const handleTagClick = async (tag: string) => {
    setFilterTag(tag);
    if (tag === '__broken__') {
      setSearchResults([]);
      return;
    }
    try {
      const bookmarks = await apiService.getBookmarksByTag(tag);
      setSearchResults(bookmarks);
    } catch {
      toast.error('Tag filter failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover and organize your resources with AI-powered insights
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookmarks</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBookmarks}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card>

          <div onClick={() => handleTagClick('__broken__')} className="cursor-pointer">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Broken Links</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{brokenCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>


          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Powered</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  <Zap className="w-8 h-8 text-yellow-500 inline" />
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Smart Search</h2>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Bookmark
              </Button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search your bookmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <Button type="submit" isLoading={isSearching}>Search</Button>
              </div>
            </form>

            {(searchResults.length > 0 || filterTag) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {filterTag === "__broken__" ? "Broken Bookmarks" : filterTag ? `Bookmarks tagged "${filterTag}"` : `Search Results (${searchResults.length})`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(filterTag === '__broken__' ? brokenBookmarks : searchResults).map(bookmark => (
                    <BookmarkCard
                      key={bookmark._id}
                      bookmark={bookmark}
                      onEdit={handleEditBookmark}
                      onDelete={handleDeleteBookmark}
                      onShare={handleShareBookmark}
                    />
                  ))}
                </div>
                <button className="mt-4 text-sm text-blue-600" onClick={() => {
                  setFilterTag(null);
                  setSearchResults([]);
                }}>
                  Clear Filter
                </button>
              </div>
            )}
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Bookmarks
              </h2>
              {recentBookmarks.length > 0 ? (
                <div className="space-y-4">
                  {recentBookmarks.map(bookmark => (
                    <BookmarkCard
                    key={bookmark._id}
                    bookmark={bookmark}
                    onEdit={handleEditBookmark}
                    onDelete={handleDeleteBookmark}
                    onShare={handleShareBookmark}
                    onTagClick={handleTagClick}  // <-- Add this line
                  />
                  
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center">No bookmarks found</p>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Tags</h3>
              {stats.topTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filterTag === tag ? "default" : "secondary"}
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </Badge>

                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No tags yet</p>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      <BookmarkForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddBookmark}
      />
    </div>
  );
};
