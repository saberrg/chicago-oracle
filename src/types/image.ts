import { AddressComponents } from '@/lib/addressService';

export interface ImageData {
  id: string;
  src: string;
  alt: string | undefined;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: string | undefined;
  location: {
    lat: number;
    lng: number;
    address: string | undefined;
  };
  enhancedAddress: AddressComponents | undefined;
}

export interface UploadImageData {
  file: File;
  title: string;
  alt: string | undefined;
  location: {
    lat: number;
    lng: number;
    address: string | undefined;
  };
  enhancedAddress: AddressComponents | undefined;
}
