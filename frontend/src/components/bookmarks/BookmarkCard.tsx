import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  Share,
  AlertTriangle,
  Clock,
  Archive,
} from 'lucide-react';
import { Bookmark } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  onTagClick?: (tag: string) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onEdit,
  onDelete,
  onShare,
  onTagClick,
  selected = false,
  onSelect,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const handleVisit = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleWaybackMachine = () => {
    window.open(
      `https://web.archive.org/web/*/${encodeURIComponent(bookmark.url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Safely format created_at date
  const createdDate = new Date(bookmark.created_at);
  const formattedDate = isNaN(createdDate.getTime()) ? 'Unknown date' : format(createdDate, 'MMM d');

  // Handle card click:
  // - if onSelect exists, toggle selection
  // - else toggle expanded
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent toggling select if clicking interactive elements:
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.closest('button') ||
      target.closest('svg') ||
      target.classList.contains('tag-badge')
    ) {
      return; // don't toggle select/expand when clicking buttons, inputs, icons, or tags
    }

    if (onSelect) {
      onSelect(bookmark._id, !selected);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={`group relative cursor-pointer select-none ${selected ? 'ring-2 ring-primary-500' : ''}`}
      onClick={handleCardClick}
      aria-pressed={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e as any);
        }
      }}
    >
      <Card hover className={`p-4 ${expanded ? 'bg-primary-50 dark:bg-primary-900' : ''}`}>
        {/* Selection checkbox */}
        {onSelect && (
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(bookmark._id, e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              aria-label={`Select bookmark titled ${bookmark.title}`}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
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

          {/* Menu */}
          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Open bookmark actions menu"
              type="button"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            {/* CORRECTED MENU AND OVERLAY STRUCTURE */}
            {showMenu && (
              <>
                {/* Click outside overlay to close the menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                  aria-hidden="true"
                />

                {/* The actual menu with a higher z-index */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <button
                    onClick={() => {
                      onEdit(bookmark);
                      setShowMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                    aria-label="Edit bookmark"
                    type="button"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      onShare(bookmark._id);
                      setShowMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                    aria-label="Share bookmark"
                    type="button"
                  >
                    <Share className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  {bookmark.is_broken && (
                    <button
                      onClick={() => {
                        handleWaybackMachine();
                        setShowMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                      aria-label="Open in Wayback Machine"
                      type="button"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Wayback Machine</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDelete(bookmark._id);
                      setShowMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    role="menuitem"
                    aria-label="Delete bookmark"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {expanded && bookmark.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">
            {bookmark.description}
          </p>
        )}

        {/* Tags */}
        {(expanded || bookmark.tags.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {bookmark.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                size="sm"
                className="cursor-pointer tag-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick && onTagClick(tag);
                }}
                aria-label={`Filter bookmarks by tag ${tag}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {bookmark.is_broken && (
              <div className="flex items-center space-x-1 text-red-500">
                <AlertTriangle className="w-3 h-3" />
                <span>Broken</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{bookmark.visit_count} visits</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span>{formattedDate}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleVisit();
              }}
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Visit ${bookmark.title}`}
              type="button"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
