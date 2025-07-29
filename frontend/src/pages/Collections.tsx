import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Share2,
  Trash2,
  ChevronDown,
  Edit,
  X,
  FolderPlus,
  Bookmark as BookmarkIcon, // Renamed to avoid conflict with type
  Book,
  AlertTriangle,
} from 'lucide-react';
import { apiService } from '../services/api';
import { Bookmark as BookmarkType, BookmarkCreate, BookmarkUpdate, Collection, CollectionCreate, CollectionUpdate, ShareResponse } from '../types/index';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { BookmarkCard } from '../components/bookmarks/BookmarkCard';
import { BookmarkForm } from '../components/bookmarks/BookmarkForm';
import toast from 'react-hot-toast';

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'title' | 'category' | 'visits';
type FilterBy = 'all' | 'working' | 'broken' | 'shared';

export const Collections: React.FC = () => {
  // State for bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkType[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());

  // State for collections
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [showAddBookmarkForm, setShowAddBookmarkForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  const [isManageCollectionModalOpen, setManageCollectionModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'bookmarks' | 'collection' | null, id?: string }>({ type: null });

  const currentCollection = useMemo(() => collections.find(c => c._id === selectedCollectionId), [collections, selectedCollectionId]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
    setSelectedBookmarks(new Set()); // clear selection on filter/sort change
  }, [bookmarks, collections, searchQuery, sortBy, filterBy, selectedCollectionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [bookmarksData, collectionsData] = await Promise.all([
        apiService.getBookmarks(),
        apiService.getCollections(),
      ]);
      setBookmarks(bookmarksData);
      setCollections(collectionsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...bookmarks];

    if (selectedCollectionId !== 'all' && currentCollection) {
      const collectionBookmarkIds = new Set(currentCollection.bookmarks);
      filtered = filtered.filter(b => collectionBookmarkIds.has(b._id));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(query) ||
        (b.description && b.description.toLowerCase().includes(query)) ||
        b.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    switch (filterBy) {
      case 'broken':
        filtered = filtered.filter(b => b.is_broken);
        break;
      case 'working':
        filtered = filtered.filter(b => !b.is_broken);
        break;
      case 'shared':
        filtered = filtered.filter(b => b.shared);
        break;
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      case 'visits':
        filtered.sort((a, b) => b.visit_count - a.visit_count);
        break;
    }

    setFilteredBookmarks(filtered);
  };

  // --- Bookmark Handlers ---
  const handleAddBookmark = async (data: BookmarkCreate) => {
    try {
      const newBookmark = await apiService.addBookmark(data);
      toast.success('Bookmark added successfully!');
      if (selectedCollectionId !== 'all') {
        await apiService.addBookmarksToCollection(selectedCollectionId, [newBookmark._id]);
      }
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add bookmark');
      throw error;
    }
  };

  const handleEditBookmark = async (data: BookmarkUpdate) => {
    if (!editingBookmark) return;
    try {
      await apiService.editBookmark(editingBookmark._id, data);
      toast.success('Bookmark updated successfully!');
      setEditingBookmark(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update bookmark');
      throw error;
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await apiService.deleteBookmark(id);
      toast.success('Bookmark deleted successfully!');
      await loadData();
    } catch (error) {
      toast.error('Failed to delete bookmark');
    }
  };

  // --- Collection Handlers ---
  const handleCreateCollection = async (name: string, bookmarkIds: string[]) => {
    try {
        const payload: CollectionCreate = { name, bookmark_ids: bookmarkIds };
        const newCollection = await apiService.createCollection(payload);
        toast.success(`Collection "${name}" created!`);
        await loadData();
        setSelectedCollectionId(newCollection._id);
        setSelectedBookmarks(new Set());
        setCreateCollectionModalOpen(false);
    } catch (error) {
        toast.error('Failed to create collection.');
    }
  };

  const handleEditCollection = async (name: string) => {
    if (!editingCollection) return;
    try {
        await apiService.updateCollection(editingCollection._id, { name });
        toast.success('Collection name updated!');
        setEditingCollection(null);
        await loadData();
    } catch (error) {
        toast.error('Failed to update collection name.');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
        await apiService.deleteCollection(id);
        toast.success('Collection deleted.');
        setSelectedCollectionId('all');
        await loadData();
    } catch (error) {
        toast.error('Failed to delete collection.');
    }
  };

  const handleAddBookmarksToCollection = async (collectionId: string) => {
      try {
          await apiService.addBookmarksToCollection(collectionId, Array.from(selectedBookmarks));
          toast.success(`${selectedBookmarks.size} bookmarks added to collection.`);
          await loadData();
          setSelectedBookmarks(new Set());
          setManageCollectionModalOpen(false);
      } catch (error) {
          toast.error('Failed to add bookmarks to collection.');
      }
  };
  
  const handleRemoveBookmarksFromCollection = async () => {
      if (!currentCollection) return;
      try {
          await apiService.removeBookmarksFromCollection(currentCollection._id, Array.from(selectedBookmarks));
          toast.success(`${selectedBookmarks.size} bookmarks removed from collection.`);
          await loadData();
          setSelectedBookmarks(new Set());
      } catch (error) {
          toast.error('Failed to remove bookmarks.');
      }
  };

  // --- Bulk Action Handlers ---
  const handleBulkShare = async () => {
    if (selectedBookmarks.size === 0) return;
    try {
      const response = await apiService.shareBookmarks(Array.from(selectedBookmarks));
      const shareUrl = `${window.location.origin}/shared/${response.share_id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success(`Share link for ${selectedBookmarks.size} bookmarks copied!`);
      setSelectedBookmarks(new Set());
    } catch (error) {
      toast.error('Failed to create share link');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookmarks.size === 0) return;
    try {
      await Promise.all(Array.from(selectedBookmarks).map(id => apiService.deleteBookmark(id)));
      toast.success(`${selectedBookmarks.size} bookmarks deleted!`);
      setSelectedBookmarks(new Set());
      await loadData();
    } catch (error) {
      toast.error('Failed to delete some bookmarks');
    }
  };

  // --- Selection Handlers ---
  const handleSelectBookmark = (id: string, selected: boolean) => {
    setSelectedBookmarks(prev => {
      const newSet = new Set(prev);
      if (selected) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(filteredBookmarks.map(b => b._id)));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookmarks</h1>
            <p className="text-gray-600 dark:text-gray-300">{filteredBookmarks.length} of {bookmarks.length} bookmarks found</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => setCreateCollectionModalOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                New Collection
            </Button>
            <Button onClick={() => setShowAddBookmarkForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Bookmark
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input type="text" placeholder="Search by title, description, or tag..." className="pl-10 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                    <select value={selectedCollectionId} onChange={(e) => setSelectedCollectionId(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="all">All Bookmarks</option>
                        {collections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2">
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                </div>
            </div>
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2">
                                    <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title">Title</option><option value="visits">Most Visited</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select value={filterBy} onChange={e => setFilterBy(e.target.value as FilterBy)} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2">
                                    <option value="all">All</option><option value="working">Working</option><option value="broken">Broken</option><option value="shared">Shared</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </Card>
        </motion.div>

        <AnimatePresence>
          {selectedBookmarks.size > 0 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedBookmarks.size} selected</span>
                    <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={filteredBookmarks.length === 0}>
                      {selectedBookmarks.size === filteredBookmarks.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    {selectedCollectionId !== 'all' && (<Button variant="outline" size="sm" onClick={() => void handleRemoveBookmarksFromCollection()}><X className="w-4 h-4 mr-2" /> Remove from Collection</Button>)}
                    <Button variant="outline" size="sm" onClick={() => setManageCollectionModalOpen(true)}><FolderPlus className="w-4 h-4 mr-2" /> Add to...</Button>
                    <Button variant="outline" size="sm" onClick={() => void handleBulkShare()}><Share2 className="w-4 h-4 mr-2" /> Share</Button>
                    <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm({ type: 'bookmarks' })}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedCollectionId !== 'all' && currentCollection && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3"><Book className="w-6 h-6 text-primary-600" /><h2 className="text-2xl font-bold text-gray-800 dark:text-white">{currentCollection.name}</h2></div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setEditingCollection(currentCollection)}><Edit className="w-5 h-5" /></Button>
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm({ type: 'collection', id: currentCollection._id })}><Trash2 className="w-5 h-5 text-red-500" /></Button>
                </div>
            </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {filteredBookmarks.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredBookmarks.map((bookmark) => (<BookmarkCard key={bookmark._id} bookmark={bookmark} onEdit={(b) => setEditingBookmark(b)} onDelete={(id) => void handleDeleteBookmark(id)} onShare={(id) => { /* Share single item */ }} selected={selectedBookmarks.has(bookmark._id)} onSelect={handleSelectBookmark} />))}
            </div>
          ) : (
            <Card className="p-12 text-center"><div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"><BookmarkIcon className="w-8 h-8 text-gray-400" /></div><h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Bookmarks Found</h3><p className="text-gray-500 dark:text-gray-400 mb-4">{searchQuery || selectedCollectionId !== 'all' ? 'Try adjusting your search or filters.' : 'Add your first bookmark to get started!'}</p><Button onClick={() => setShowAddBookmarkForm(true)}><Plus className="w-4 h-4 mr-2" />Add Bookmark</Button></Card>
          )}
        </motion.div>
      </div>

      <BookmarkForm isOpen={showAddBookmarkForm} onClose={() => setShowAddBookmarkForm(false)} onSubmit={(data) => handleAddBookmark(data as BookmarkCreate)} />
      <BookmarkForm isOpen={!!editingBookmark} onClose={() => setEditingBookmark(null)} onSubmit={(data) => handleEditBookmark(data as BookmarkUpdate)} initialData={editingBookmark || undefined} isEditing={true} />
      
      <CollectionForm isOpen={isCreateCollectionModalOpen || !!editingCollection} onClose={() => { setCreateCollectionModalOpen(false); setEditingCollection(null); }} onSubmit={editingCollection ? (name) => handleEditCollection(name) : (name) => handleCreateCollection(name, Array.from(selectedBookmarks))} collection={editingCollection} />
      <ManageCollectionModal isOpen={isManageCollectionModalOpen} onClose={() => setManageCollectionModalOpen(false)} collections={collections} onAddToCollection={handleAddBookmarksToCollection} onCreateCollection={() => { setCreateCollectionModalOpen(false); setCreateCollectionModalOpen(true); }} />
      <ConfirmationModal isOpen={showDeleteConfirm.type !== null} onClose={() => setShowDeleteConfirm({ type: null })} onConfirm={() => { if (showDeleteConfirm.type === 'bookmarks') { void handleBulkDelete(); } else if (showDeleteConfirm.type === 'collection' && showDeleteConfirm.id) { void handleDeleteCollection(showDeleteConfirm.id); } setShowDeleteConfirm({ type: null }); }} title={`Delete ${showDeleteConfirm.type}?`} description={`Are you sure you want to delete ${showDeleteConfirm.type === 'bookmarks' ? `${selectedBookmarks.size} bookmark(s)` : `the "${currentCollection?.name}" collection`}? This action cannot be undone.`} />
    </div>
  );
};

// --- New Child Components for Modals ---

interface CollectionFormProps { isOpen: boolean; onClose: () => void; onSubmit: (name: string) => void | Promise<void>; collection?: Collection | null; }
const CollectionForm: React.FC<CollectionFormProps> = ({ isOpen, onClose, onSubmit, collection }) => {
    const [name, setName] = useState('');
    useEffect(() => { if (collection) setName(collection.name); else setName(''); }, [collection, isOpen]);
    
    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (name.trim()) { 
            void onSubmit(name.trim()); 
        } else { 
            toast.error('Collection name cannot be empty.'); 
        } 
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={collection ? 'Edit Collection' : 'Create New Collection'}>
            <form onSubmit={handleSubmit}>
                <div className="mt-4">
                    <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Collection Name</label>
                    <Input id="collection-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full" placeholder="e.g., React Resources" autoFocus />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{collection ? 'Save Changes' : 'Create Collection'}</Button>
                </div>
            </form>
        </Modal>
    );
};

interface ManageCollectionModalProps { isOpen: boolean; onClose: () => void; collections: Collection[]; onAddToCollection: (collectionId: string) => void | Promise<void>; onCreateCollection: () => void; }
const ManageCollectionModal: React.FC<ManageCollectionModalProps> = ({ isOpen, onClose, collections, onAddToCollection, onCreateCollection }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add to Collection">
            <div className="mt-4 max-h-60 overflow-y-auto">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {collections.map(collection => (
                        <li key={collection._id} onClick={() => void onAddToCollection(collection._id)} className="p-3 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{collection.name}</span>
                            <span className="text-sm text-gray-500">{collection.bookmarks.length} items</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" className="w-full" onClick={onCreateCollection}><Plus className="w-4 h-4 mr-2" />Create New Collection</Button>
            </div>
        </Modal>
    );
};

interface ConfirmationModalProps { isOpen: boolean; onClose: () => void; onConfirm: () => void | Promise<void>; title: string; description: string; }
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, description }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="mt-2">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                    </div>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <Button variant="danger" onClick={() => void onConfirm()}>Confirm</Button>
                <Button variant="outline" onClick={onClose} className="mr-3">Cancel</Button>
            </div>
        </Modal>
    );
};
