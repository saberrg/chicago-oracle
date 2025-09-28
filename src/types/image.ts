import { AddressComponents } from '@/lib/addressService';

export interface ImageData {
  id: string;
  src: string;
  alt?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  enhancedAddress?: AddressComponents;
}

export interface UploadImageData {
  file: File;
  title: string;
  alt?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  enhancedAddress?: AddressComponents;
}
