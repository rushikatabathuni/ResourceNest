import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Share2, 
  ExternalLink, 
  Calendar, 
  Tag, 
  Bookmark,
  Globe,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '../services/api';
import { Bookmark as BookmarkType } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const SharedBookmarks: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareId) {
      loadSharedBookmarks();
    }
  }, [shareId]);

  const loadSharedBookmarks = async () => {
    if (!shareId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getSharedBookmarks(shareId);
      setBookmarks(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load shared bookmarks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitBookmark = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading shared bookmarks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Bookmarks Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The shared link may have expired or the bookmarks have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Shared Resource Collection
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {bookmarks.length} carefully curated bookmarks shared with you
          </p>
          <Button
            variant="outline"
            onClick={handleCopyShareLink}
            className="inline-flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Copy Share Link</span>
          </Button>
        </motion.div>

        {/* Bookmarks Grid */}
        {bookmarks.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {bookmarks.map((bookmark, index) => (
              <motion.div
                key={bookmark._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="p-6 group relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {getFaviconUrl(bookmark.url) && (
                        <img
                          src={getFaviconUrl(bookmark.url)!}
                          alt=""
                          className="w-6 h-6 rounded-sm flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {bookmark.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {new URL(bookmark.url).hostname}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVisitBookmark(bookmark.url)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Description */}
                  {bookmark.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {bookmark.description}
                    </p>
                  )}

                  {/* Tags */}
                  {bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {bookmark.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {bookmark.tags.length > 3 && (
                        <Badge variant="secondary" size="sm">
                          +{bookmark.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-3">
                      <Badge variant="default" size="sm">
                        {bookmark.category}
                      </Badge>
                      {bookmark.is_broken && (
                        <div className="flex items-center space-x-1 text-red-500">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Link may be broken</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(bookmark.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  {/* Click Overlay */}
                  <button
                    onClick={() => handleVisitBookmark(bookmark.url)}
                    className="absolute inset-0 w-full h-full bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                    aria-label={`Visit ${bookmark.title}`}
                  />
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No Bookmarks Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              This shared collection doesn't contain any bookmarks yet.
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Globe className="w-4 h-4" />
            <span>Powered by ResourceNest</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};