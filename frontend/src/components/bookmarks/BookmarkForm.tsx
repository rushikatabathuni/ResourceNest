import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { BookmarkCreate, BookmarkUpdate } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface BookmarkFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookmarkCreate | BookmarkUpdate) => Promise<void>;
  initialData?: Partial<BookmarkCreate | BookmarkUpdate>;
  isEditing?: boolean;
}

export const BookmarkForm: React.FC<BookmarkFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BookmarkCreate | BookmarkUpdate>({
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: BookmarkCreate | BookmarkUpdate) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      // Error handling is done in parent
    }
  };

  const validateUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Bookmark' : 'Add New Bookmark'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Title"
          {...register('title', { required: 'Title is required' })}
          error={errors.title?.message}
          placeholder="Enter bookmark title"
          autoFocus
        />

        <Input
          label="URL"
          type="url"
          {...register('url', { 
            required: 'URL is required',
            validate: (value?: string) => {
              if (!value) return 'URL is required';
              try {
                new URL(value);
                return true;
              } catch {
                return 'Please enter a valid URL';
              }
            },
          })}
          error={errors.url?.message}
          placeholder="https://example.com"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 transition-all duration-200"
            placeholder="Add a description for this bookmark..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset(initialData);
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
          >
            {isEditing ? 'Update' : 'Add'} Bookmark
          </Button>
        </div>
      </form>
    </Modal>
  );
};
