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
import { format } from 'date-fns';

// Assuming these are simple, reusable UI components located in a ../ui/ directory
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
// The Textarea import has been removed.

// Assuming Bookmark type is defined in a central types file
import { Bookmark } from '../../types';


interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  // This prop allows the card to tell the parent list to refresh after an update
  onBookmarkUpdated: () => void; 
  onTagClick?: (tag: string) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onDelete,
  onShare,
  onBookmarkUpdated,
  onTagClick,
  selected = false,
  onSelect,
}) => {
  // --- STATE FOR THE CARD DISPLAY ---
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // --- STATE FOR THE EDIT MODAL (contained in this component) ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description || '',
    tags: bookmark.tags.join(', '),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // --- HELPER FUNCTIONS ---
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

  const createdDate = new Date(bookmark.created_at);
  const formattedDate = isNaN(createdDate.getTime()) ? 'Unknown date' : format(createdDate, 'MMM d');
  
  // --- EDIT MODAL LOGIC ---
  const handleOpenEditModal = () => {
    // Pre-fill form with current bookmark data when opening
    setFormData({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description || '',
        tags: bookmark.tags.join(', '),
    });
    setError(null);
    setIsEditing(true);
    setShowMenu(false); // Close the dropdown menu
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      ...bookmark,
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };

    try {
      const response = await fetch(`/api/bookmarks/edit/${bookmark._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update bookmark.');
      }

      onBookmarkUpdated(); // Tell parent to refresh its data
      setIsEditing(false);  // Close the modal on success

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- CARD CLICK LOGIC ---
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.closest('button') ||
      target.closest('svg') ||
      target.classList.contains('tag-badge')
    ) {
      return;
    }

    if (onSelect) {
      onSelect(bookmark._id, !selected);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      {/* --- THE CARD COMPONENT --- */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        className={`group relative cursor-pointer select-none ${selected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={handleCardClick}
        tabIndex={0}
      >
        <Card hover className={`p-4 ${expanded ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
          {/* Card content and header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFaviconUrl(bookmark.url) && (
                <img src={getFaviconUrl(bookmark.url)!} alt="" className="w-6 h-6 rounded-sm flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')}/>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{bookmark.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{new URL(bookmark.url).hostname}</p>
              </div>
            </div>

            {/* Menu container with fixed clickability */}
            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Open bookmark actions menu" type="button">
                <MoreVertical className="w-4 h-4" />
              </Button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} aria-hidden="true"/>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20" role="menu">
                    <button onClick={handleOpenEditModal} className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem"><Edit className="w-4 h-4" /><span>Edit</span></button>
                    <button onClick={() => { onShare(bookmark._id); setShowMenu(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem"><Share className="w-4 h-4" /><span>Share</span></button>
                    {bookmark.is_broken && (<button onClick={() => { handleWaybackMachine(); setShowMenu(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem"><Archive className="w-4 h-4" /><span>Wayback Machine</span></button>)}
                    <button onClick={() => { onDelete(bookmark._id); setShowMenu(false); }} className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" role="menuitem"><Trash2 className="w-4 h-4" /><span>Delete</span></button>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Expanded content */}
          {expanded && bookmark.description && (<p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">{bookmark.description}</p>)}
          {(expanded || bookmark.tags.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-3">
              {bookmark.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm" className="cursor-pointer tag-badge" onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }}>{tag}</Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-3">
              {bookmark.is_broken && (<div className="flex items-center space-x-1 text-red-500"><AlertTriangle className="w-3 h-3" /><span>Broken</span></div>)}
              <div className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>{bookmark.visit_count} visits</span></div>
            </div>
            <div className="flex items-center space-x-2">
              <span>{formattedDate}</span>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleVisit(); }} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Visit ${bookmark.title}`} type="button"><ExternalLink className="w-3 h-3" /></Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* --- THE EDIT MODAL (rendered conditionally) --- */}
      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Bookmark">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
              <Input id="url" name="url" type="url" value={formData.url} onChange={handleFormChange} required />
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <Input id="title" name="title" type="text" value={formData.title} onChange={handleFormChange} />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              {/* This now uses a standard HTML textarea element */}
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
              <Input id="tags" name="tags" type="text" value={formData.tags} onChange={handleFormChange} />
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
