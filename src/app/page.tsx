'use client';

import { useEffect, useRef, useState } from 'react';
import NextImage from "next/image";
import ImageCard from './components/ImageCard';
import { getImages } from '@/lib/imageService';
import { ImageData } from '@/types/image';
import { DocumentSnapshot } from 'firebase/firestore';

// Mock image data - fallback when no real images are available
const mockImages: ImageData[] = [
  { 
    id: "1", 
    src: "https://picsum.photos/400/500?random=1", 
    alt: "Sample image 1", 
    title: "the place",
    createdAt: new Date(),
    updatedAt: new Date(),
    location: { lat: 41.8781, lng: -87.6298, address: "Chicago, IL" }
  },
  { 
    id: "2", 
    src: "https://picsum.photos/400/500?random=2", 
    alt: "Sample image 2", 
    title: "another place",
    createdAt: new Date(),
    updatedAt: new Date(),
    location: { lat: 41.8781, lng: -87.6298, address: "Chicago, IL" }
  },
  { 
    id: "3", 
    src: "https://picsum.photos/400/500?random=3", 
    alt: "Sample image 3", 
    title: "somewhere else",
    createdAt: new Date(),
    updatedAt: new Date(),
    location: { lat: 41.8781, lng: -87.6298, address: "Chicago, IL" }
  },
];

export default function Home() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Load images from Firebase
  useEffect(() => {
    const loadImages = async () => {
      try {
        const { images: firebaseImages, lastDoc: newLastDoc } = await getImages(10);
        if (firebaseImages.length > 0) {
          // Remove any duplicates from the initial load
          const uniqueImages = firebaseImages.filter((image, index, self) => 
            index === self.findIndex(img => img.id === image.id)
          );
          
          // Debug logging to help identify duplicates
          if (firebaseImages.length !== uniqueImages.length) {
            console.warn(`Removed ${firebaseImages.length - uniqueImages.length} duplicate images from initial load`);
          }
          
          setImages(uniqueImages);
          setLastDoc(newLastDoc);
          setHasMore(firebaseImages.length === 10);
        } else {
          // Use mock images if no real images are available
          setImages(mockImages);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to load images:', error);
        // Use mock images as fallback
        setImages(mockImages);
        setHasMore(false);
      } finally {
        setInitialLoading(false);
      }
    };

    loadImages();
  }, []);

  // Infinite scroll functionality
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loading && !initialLoading && hasMore) {
          setLoading(true);
          try {
            const { images: moreImages, lastDoc: newLastDoc } = await getImages(10, lastDoc);
            if (moreImages.length > 0) {
              setImages(prev => {
                // Remove duplicates within the new batch first
                const uniqueNewImages = moreImages.filter((image, index, self) => 
                  index === self.findIndex(img => img.id === image.id)
                );
                
                // Then filter out any that already exist in the current state
                const existingIds = new Set(prev.map(img => img.id));
                const trulyNewImages = uniqueNewImages.filter(img => !existingIds.has(img.id));
                
                // Debug logging for pagination duplicates
                if (moreImages.length !== uniqueNewImages.length) {
                  console.warn(`Removed ${moreImages.length - uniqueNewImages.length} internal duplicates from pagination`);
                }
                if (uniqueNewImages.length !== trulyNewImages.length) {
                  console.warn(`Filtered out ${uniqueNewImages.length - trulyNewImages.length} existing images from pagination`);
                }
                
                return [...prev, ...trulyNewImages];
              });
              setLastDoc(newLastDoc);
              setHasMore(moreImages.length === 10);
            } else {
              setHasMore(false);
            }
          } catch (error) {
            console.error('Failed to load more images:', error);
            // Don't set loading to false on error to allow retry
          } finally {
            setLoading(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loading, initialLoading, hasMore, lastDoc]);

  return (
    <div className="min-h-screen bg-[#d9d9d9]">
      {/* Header */}
      <header className="relative h-[120px] sm:h-[198px] bg-[#17663D]">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative h-full flex items-center justify-between px-4 sm:px-16">
          {/* Logo */}
          <div className="flex items-center justify-center w-full">
            <NextImage
              src="/chicago-oracle.svg"
              alt="Chicago Oracle"
              width={888}
              height={333}
              className="h-auto max-w-full object-contain"
              priority
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-8 py-8">
        {/* Image Feed */}
        <div className="max-w-md mx-auto sm:max-w-lg md:max-w-xl">
          {initialLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#17663d]"></div>
            </div>
          ) : (
            images.map((image, index) => (
              <ImageCard
                key={`${image.id}-${index}`}
                image={image}
              />
            ))
          )}
          
          {/* Loading indicator */}
          <div ref={loaderRef} className="flex justify-center py-8">
            {loading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#17663d]"></div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
