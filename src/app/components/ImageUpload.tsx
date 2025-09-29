'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { uploadImage } from '@/lib/imageService';
import { getCurrentLocation, LocationData } from '@/lib/locationService';
import { getLocationFromFile } from '@/lib/exifService';
import { getEnhancedAddress, AddressComponents } from '@/lib/addressService';
import { UploadImageData } from '@/types/image';
import { getCurrentUser } from '@/lib/authService';

// Target aspect ratio for consistent display (4:5 like Instagram)
const TARGET_ASPECT_RATIO = 4 / 5;
const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 1000;

interface ImageUploadProps {
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
}

export default function ImageUpload({ onUploadSuccess, onUploadError }: ImageUploadProps) {
  const [, setFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [enhancedAddress, setEnhancedAddress] = useState<AddressComponents | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setIsAuthenticated(!!user);
  }, []);

  /**
   * Get enhanced address data when location coordinates are available
   */
  const getEnhancedAddressData = async (lat: number, lng: number) => {
    try {
      const addressData = await getEnhancedAddress(lat, lng);
      setEnhancedAddress(addressData);
      return addressData;
    } catch (error) {
      console.warn('Failed to get enhanced address:', error);
      setEnhancedAddress(null);
      return null;
    }
  };

  /**
   * Process image to fit target aspect ratio (4:5)
   * Crops and resizes the image to ensure perfect fit in display frame
   */
  const processImageForDisplay = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();

      img.onload = () => {
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const originalWidth = img.width;
        const originalHeight = img.height;
        const originalAspectRatio = originalWidth / originalHeight;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = originalWidth;
        let sourceHeight = originalHeight;

        // Calculate crop dimensions to match target aspect ratio
        if (originalAspectRatio > TARGET_ASPECT_RATIO) {
          // Image is wider than target ratio - crop width
          sourceWidth = originalHeight * TARGET_ASPECT_RATIO;
          sourceX = (originalWidth - sourceWidth) / 2;
        } else if (originalAspectRatio < TARGET_ASPECT_RATIO) {
          // Image is taller than target ratio - crop height
          sourceHeight = originalWidth / TARGET_ASPECT_RATIO;
          sourceY = (originalHeight - sourceHeight) / 2;
        }

        // Set canvas dimensions to target size
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;

        // Draw the cropped and resized image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          TARGET_WIDTH,
          TARGET_HEIGHT
        );

        // Convert canvas to blob and then to File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }

            const processedFile = new File(
              [blob],
              file.name,
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            resolve(processedFile);
          },
          'image/jpeg',
          0.9 // High quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log('📁 File selected:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: selectedFile.lastModified
      });
      
      setFile(selectedFile);
      
      try {
        console.log('🖼️ Processing image for display...');
        // Process the image to fit the target aspect ratio
        const processed = await processImageForDisplay(selectedFile);
        setProcessedFile(processed);
        console.log('✅ Image processed successfully');
        
        // Create preview from processed image
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(processed);
        
      } catch (error: unknown) {
        console.error('❌ Failed to process image:', error);
        onUploadError?.('Failed to process image. Please try a different image.');
        return;
      }
      
      // Automatically try to get location from EXIF data or current location
      try {
        console.log('📍 Attempting to get location from file...');
        setLocationLoading(true);
        const fileLocation = await getLocationFromFile(selectedFile, getCurrentLocation);
        console.log('📍 Location obtained:', fileLocation);
        setLocation(fileLocation);
        
        // Get enhanced address data if location was found
        if (fileLocation.lat && fileLocation.lng) {
          console.log('🏠 Getting enhanced address data...');
          await getEnhancedAddressData(fileLocation.lat, fileLocation.lng);
        }
      } catch (error: unknown) {
        console.warn('⚠️ Failed to get location:', error);
        // Don't show error to user, just log it
      } finally {
        setLocationLoading(false);
      }
    }
  };

  const handleGetLocation = async () => {
    console.log('📍 Manual location request initiated...');
    setLocationLoading(true);
    try {
      const currentLocation = await getCurrentLocation();
      console.log('📍 Current location obtained:', currentLocation);
      setLocation(currentLocation);
      
      // Get enhanced address data
      if (currentLocation.lat && currentLocation.lng) {
        console.log('🏠 Getting enhanced address for current location...');
        await getEnhancedAddressData(currentLocation.lat, currentLocation.lng);
      }
    } catch (error: unknown) {
      console.error('❌ Location error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      onUploadError?.(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Upload form submission started');
    console.log('📋 Form validation:', {
      hasFile: !!processedFile,
      hasTitle: !!title,
      hasLocation: !!location,
      title: title,
      location: location
    });
    
    if (!processedFile || !title || !location) {
      console.error('❌ Form validation failed - missing required fields');
      onUploadError?.('Please fill in all fields and get your location');
      return;
    }

    console.log('✅ Form validation passed, starting upload...');
    setLoading(true);
    try {
      const uploadData: UploadImageData = {
        file: processedFile,
        title,
        location,
        enhancedAddress: enhancedAddress ?? undefined
      };

      console.log('📤 Upload data prepared:', {
        title: uploadData.title,
        location: uploadData.location,
        hasEnhancedAddress: !!uploadData.enhancedAddress,
        fileSize: uploadData.file.size,
        fileName: uploadData.file.name
      });

      console.log('☁️ Uploading to Firebase...');
      await uploadImage(uploadData);
      console.log('✅ Upload successful!');
      
      // Reset form
      setFile(null);
      setProcessedFile(null);
      setTitle('');
      setLocation(null);
      setEnhancedAddress(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onUploadSuccess?.();
    } catch (error: unknown) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      onUploadError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#17663D] mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            You must be signed in to upload images.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-[#17663D] mb-6 text-center">
        Upload Image
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#17663D]"
            required
          />
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="mt-4">
            <div 
              className="relative w-full rounded-md overflow-hidden border-2 border-[#17663d]"
              style={{ aspectRatio: '4/5' }}
            >
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Image has been processed to fit display frame (4:5 ratio)
            </p>
          </div>
        )}

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#17663D]"
            placeholder="Enter image title"
            required
          />
        </div>


        {/* Location Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          
          {locationLoading ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">
                <div className="font-medium">Getting location...</div>
                <div>Checking photo metadata and current location</div>
              </div>
            </div>
          ) : !location ? (
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="w-full px-4 py-2 bg-[#17663D] text-white rounded-md hover:bg-[#0f4a2a] focus:outline-none focus:ring-2 focus:ring-[#17663D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Current Location
            </button>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm text-green-800">
                <div className="font-medium">Location captured:</div>
                <div>Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</div>
                {location.address && (
                  <div>Address: {location.address}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocation(null);
                  setEnhancedAddress(null);
                }}
                className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
              >
                Change Location
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !processedFile || !title || !location}
          className="w-full px-4 py-2 bg-[#17663D] text-white rounded-md hover:bg-[#0f4a2a] focus:outline-none focus:ring-2 focus:ring-[#17663D] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
    </div>
  );
}
