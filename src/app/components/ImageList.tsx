'use client';

import { useState, useEffect } from 'react';
import { ImageData } from '@/types/image';
import { getImages, updateImageMetadata, deleteImage } from '@/lib/imageService';

interface ImageListProps {
  onUpdate: (() => void) | undefined;
}

export default function ImageList({ onUpdate }: ImageListProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getImages(50); // Get up to 50 images
      setImages(result.images);
    } catch (err: unknown) {
      setError('Failed to load images');
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (image: ImageData) => {
    setEditingId(image.id);
    setEditTitle(image.title);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditSave = async (imageId: string) => {
    try {
      if (!editTitle.trim()) {
        setError('Title cannot be empty');
        return;
      }

      await updateImageMetadata(imageId, { title: editTitle.trim() });
      setEditingId(null);
      setEditTitle('');
      await loadImages(); // Reload to get updated data
      onUpdate?.();
    } catch (err: unknown) {
      setError('Failed to update image title');
      console.error('Error updating image:', err);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await deleteImage(imageId);
      await loadImages(); // Reload to reflect deletion
      onUpdate?.();
    } catch (err: unknown) {
      setError('Failed to delete image');
      console.error('Error deleting image:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#17663D]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No images found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#17663D]">All Images</h2>
        <button
          onClick={loadImages}
          className="px-4 py-2 bg-[#17663D] text-white rounded hover:bg-[#0f4a2a] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Image */}
            <div className="aspect-square relative">
              <img
                src={image.src}
                alt={image.alt || image.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <div className="mb-3">
                {editingId === image.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#17663D]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditSave(image.id);
                        } else if (e.key === 'Escape') {
                          handleEditCancel();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(image.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <h3 className="font-semibold text-lg text-gray-800">
                    {image.title}
                  </h3>
                )}
              </div>

              {/* Actions */}
              {editingId !== image.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditStart(image)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Edit Title
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
