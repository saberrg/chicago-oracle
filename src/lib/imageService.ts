import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { storage, db } from './firebase';
import { ImageData, UploadImageData } from '@/types/image';

const IMAGES_COLLECTION = 'images';
const STORAGE_FOLDER = 'images';

/**
 * Upload an image to Firebase Storage and save metadata to Firestore
 */
export async function uploadImage(imageData: UploadImageData): Promise<ImageData> {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = imageData.file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${STORAGE_FOLDER}/${fileName}`);
    
    // Upload file to Firebase Storage
    const uploadResult = await uploadBytes(storageRef, imageData.file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Create image data object
    const newImageData: Omit<ImageData, 'id'> = {
      src: downloadURL,
      alt: imageData.alt || '',
      title: imageData.title,
      createdAt: new Date(),
      updatedAt: new Date(),
      location: imageData.location
    };
    
    // Save metadata to Firestore
    const docRef = await addDoc(collection(db, IMAGES_COLLECTION), newImageData);
    
    return {
      id: docRef.id,
      ...newImageData
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Get all images with pagination support
 */
export async function getImages(
  pageSize: number = 10, 
  lastDoc?: DocumentSnapshot
): Promise<{ images: ImageData[]; lastDoc?: DocumentSnapshot }> {
  try {
    let q = query(
      collection(db, IMAGES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    if (lastDoc) {
      q = query(
        collection(db, IMAGES_COLLECTION),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const images: ImageData[] = [];
    let newLastDoc: DocumentSnapshot | undefined;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      images.push({
        id: doc.id,
        src: data.src,
        alt: data.alt || '',
        title: data.title,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        uploadedBy: data.uploadedBy,
        location: data.location
      });
      newLastDoc = doc;
    });
    
    return {
      images,
      lastDoc: newLastDoc
    };
  } catch (error) {
    console.error('Error getting images:', error);
    throw new Error('Failed to get images');
  }
}

/**
 * Get a single image by ID
 */
export async function getImageById(id: string): Promise<ImageData | null> {
  try {
    const docRef = doc(db, IMAGES_COLLECTION, id);
    const docSnap = await getDocs(query(collection(db, IMAGES_COLLECTION), limit(1)));
    
    if (docSnap.empty) {
      return null;
    }
    
    const data = docSnap.docs[0].data();
    return {
      id: docSnap.docs[0].id,
      src: data.src,
      alt: data.alt || '',
      title: data.title,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      uploadedBy: data.uploadedBy,
      tags: data.tags || [],
      location: data.location
    };
  } catch (error) {
    console.error('Error getting image:', error);
    throw new Error('Failed to get image');
  }
}

/**
 * Delete an image from both Storage and Firestore
 */
export async function deleteImage(id: string): Promise<void> {
  try {
    // Get image data first to get the storage path
    const imageData = await getImageById(id);
    if (!imageData) {
      throw new Error('Image not found');
    }
    
    // Extract the full path from URL (already includes the images/ folder)
    const url = new URL(imageData.src);
    // The pathname includes the full storage path, we just need to decode it
    const fullPath = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode
    
    // Delete from Storage
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    const docRef = doc(db, IMAGES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Update image metadata
 */
export async function updateImageMetadata(
  id: string, 
  updates: Partial<Pick<ImageData, 'title' | 'alt' | 'location'>>
): Promise<void> {
  try {
    const docRef = doc(db, IMAGES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating image:', error);
    throw new Error('Failed to update image');
  }
}

/**
 * Get images by location (within a radius of a point)
 */
export async function getImagesByLocation(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number = 10
): Promise<ImageData[]> {
  try {
    const querySnapshot = await getDocs(collection(db, IMAGES_COLLECTION));
    const images: ImageData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const imageLocation = data.location;
      
      if (imageLocation) {
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          centerLat, 
          centerLng, 
          imageLocation.lat, 
          imageLocation.lng
        );
        
        if (distance <= radiusKm) {
          images.push({
            id: doc.id,
            src: data.src,
            alt: data.alt || '',
            title: data.title,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            uploadedBy: data.uploadedBy,
            location: data.location
          });
        }
      }
    });
    
    return images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting images by location:', error);
    throw new Error('Failed to get images by location');
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
