import { ImageData } from '@/types/image';
import ImageWithMap from './ImageWithMap';
import { getDescriptiveLocation } from '@/lib/addressService';

interface ImageCardProps {
  image: ImageData;
}

export default function ImageCard({ image }: ImageCardProps) {
  // Use the stored enhanced address data directly from the image object
  // If enhanced address is missing, the migration will be triggered automatically in the background
  const displayAddress = getDescriptiveLocation(image.enhancedAddress ?? null, image.location.address);
  
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
              {displayAddress}
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
