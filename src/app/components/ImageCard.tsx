import { ImageData } from '@/types/image';
import ImageWithMap from './ImageWithMap';

interface ImageCardProps {
  image: ImageData;
}

export default function ImageCard({ image }: ImageCardProps) {
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
