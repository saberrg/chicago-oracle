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
}
