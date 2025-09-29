'use client';

import { useState } from 'react';
import NextImage from "next/image";
import dynamic from 'next/dynamic';
import { ImageData } from '@/types/image';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse" />
});

interface ImageWithMapProps {
  image: ImageData;
  className: string | undefined;
}


export default function ImageWithMap({ image, className = "" }: ImageWithMapProps) {
  const [showMap, setShowMap] = useState(false);

  const toggleView = () => {
    setShowMap(!showMap);
  };

  if (showMap) {
    return (
      <div 
        className={`relative cursor-pointer ${className}`}
        onClick={toggleView}
      >
        <MapComponent image={image} />
      </div>
    );
  }

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onClick={toggleView}
    >
      {/* Image View */}
      <div className="relative w-full h-full">
        <NextImage
          src={image.src}
          alt={image.alt || image.title}
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    </div>
  );
}
