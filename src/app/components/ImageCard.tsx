import { ImageData } from '@/types/image';
import ImageWithMap from './ImageWithMap';
import { useState, useEffect } from 'react';
import { getEnhancedAddress, getDescriptiveLocation, AddressComponents } from '@/lib/addressService';

interface ImageCardProps {
  image: ImageData;
}

export default function ImageCard({ image }: ImageCardProps) {
  const [enhancedAddress, setEnhancedAddress] = useState<AddressComponents | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Console log the image object to see what data we have
  console.log('ImageCard - Full image object:', image);
  console.log('ImageCard - Location data:', image.location);
  console.log('ImageCard - Address:', image.location.address);

  useEffect(() => {
    const fetchEnhancedAddress = async () => {
      if (!image.location.lat || !image.location.lng) return;
      
      setIsLoadingAddress(true);
      try {
        const address = await getEnhancedAddress(image.location.lat, image.location.lng);
        setEnhancedAddress(address);
        console.log('Enhanced address result:', address);
      } catch (error) {
        console.error('Failed to get enhanced address:', error);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    fetchEnhancedAddress();
  }, [image.location.lat, image.location.lng]);

  const displayAddress = getDescriptiveLocation(enhancedAddress, image.location.address);
  
  return (
    <div className="mb-8">
      {/* Title */}
      <div className="mb-4 text-center">
        <h2 
          className="text-white text-3xl sm:text-5xl md:text-6xl font-bold" 
          style={{ textShadow: '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black' }}
        >
          {image.title}
        </h2>
        
        {/* Address and Upload Time */}
        <div className="mt-4 space-y-2">
          {(displayAddress || image.location.address) && (
            <p 
              className="text-black text-lg sm:text-xl font-medium"
            >
              {isLoadingAddress ? 'Loading location...' : displayAddress}
            </p>
          )}
          <p 
            className="text-black text-sm sm:text-base opacity-90"
          >
            Uploaded {new Date(image.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div 
        className="relative max-w-lg mx-auto"
        style={{ aspectRatio: '4/5' }} // Instagram-like aspect ratio
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden border-4 border-[#17663d] shadow-lg">
          <ImageWithMap image={image} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
