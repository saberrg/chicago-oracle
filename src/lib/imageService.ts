import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
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
import { getEnhancedAddress } from './addressService';

const IMAGES_COLLECTION = 'images';
const STORAGE_FOLDER = 'images';

/**
 * Migrate an image to include enhanced address data if missing
 * This function will be called automatically when loading images without enhanced address
 */
export async function migrateImageEnhancedAddress(imageId: string, lat: number, lng: number): Promise<void> {
  try {
    console.log(`Migrating enhanced address for image ${imageId}`);
    
    // Get enhanced address data
    const enhancedAddress = await getEnhancedAddress(lat, lng);
    
    if (enhancedAddress) {
      // Update the image document with enhanced address data
      const docRef = doc(db, IMAGES_COLLECTION, imageId);
      await updateDoc(docRef, {
        enhancedAddress,
        updatedAt: new Date()
      });
      
      console.log(`Successfully migrated enhanced address for image ${imageId}`);
    } else {
      console.warn(`Could not get enhanced address for image ${imageId}`);
    }
  } catch (error) {
    console.error(`Failed to migrate enhanced address for image ${imageId}:`, error);
    // Don't throw error to avoid breaking the user experience
  }
}

/**
 * Upload an image to Firebase Storage and save metadata to Firestore
 */
export async function uploadImage(imageData: UploadImageData): Promise<ImageData> {
  console.log('☁️ Starting image upload to Firebase...');
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = imageData.file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    console.log('📁 File details:', {
      originalName: imageData.file.name,
      generatedName: fileName,
      size: imageData.file.size,
      type: imageData.file.type
    });
    
    // Create storage reference
    const storageRef = ref(storage, `${STORAGE_FOLDER}/${fileName}`);
    console.log('📂 Storage path:', `${STORAGE_FOLDER}/${fileName}`);
    
    // Upload file to Firebase Storage
    console.log('⬆️ Uploading file to Firebase Storage...');
    const uploadResult = await uploadBytes(storageRef, imageData.file);
    console.log('✅ File uploaded to Storage successfully');
    
    // Get download URL
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('✅ Download URL obtained:', downloadURL);
    
    // Create image data object
    const newImageData: Omit<ImageData, 'id'> = {
      src: downloadURL,
      alt: imageData.alt || '',
      title: imageData.title,
      createdAt: new Date(),
      updatedAt: new Date(),
      location: imageData.location,
      enhancedAddress: imageData.enhancedAddress ?? undefined
    };
    
    console.log('💾 Saving metadata to Firestore...', {
      title: newImageData.title,
      hasLocation: !!newImageData.location,
      hasEnhancedAddress: !!newImageData.enhancedAddress,
      location: newImageData.location
    });
    
    // Save metadata to Firestore
    const docRef = await addDoc(collection(db, IMAGES_COLLECTION), newImageData);
    console.log('✅ Metadata saved to Firestore with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...newImageData
    };
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Get all images with pagination support
 */
export async function getImages(
  pageSize: number = 10, 
  lastDoc?: DocumentSnapshot
): Promise<{ images: ImageData[]; lastDoc: DocumentSnapshot | undefined }> {
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
      const imageData = {
        id: doc.id,
        src: data.src,
        alt: data.alt || '',
        title: data.title,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        uploadedBy: data.uploadedBy,
        location: data.location,
        enhancedAddress: data.enhancedAddress
      };
      
      images.push(imageData);
      newLastDoc = doc;
      
      // Trigger migration for images without enhanced address data
      if (!data.enhancedAddress && data.location?.lat && data.location?.lng) {
        // Run migration in background - don't await to avoid blocking
        migrateImageEnhancedAddress(doc.id, data.location.lat, data.location.lng);
      }
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
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    const imageData = {
      id: docSnap.id,
      src: data.src,
      alt: data.alt || '',
      title: data.title,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      uploadedBy: data.uploadedBy,
      location: data.location,
      enhancedAddress: data.enhancedAddress
    };
    
    // Trigger migration for images without enhanced address data
    if (!data.enhancedAddress && data.location?.lat && data.location?.lng) {
      // Run migration in background - don't await to avoid blocking
      migrateImageEnhancedAddress(docSnap.id, data.location.lat, data.location.lng);
    }
    
    return imageData;
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
    
    // Extract the storage path from the Firebase Storage URL
    // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?{params}
    const url = new URL(imageData.src);
    const pathMatch = url.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/);
    
    if (!pathMatch) {
      throw new Error('Invalid Firebase Storage URL format');
    }
    
    // Decode the path (Firebase Storage URLs are URL-encoded)
    const fullPath = decodeURIComponent(pathMatch[1]!);
    
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
  updates: Partial<Pick<ImageData, 'title' | 'alt' | 'location' | 'enhancedAddress'>>
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
          const imageData = {
            id: doc.id,
            src: data.src,
            alt: data.alt || '',
            title: data.title,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            uploadedBy: data.uploadedBy,
            location: data.location,
            enhancedAddress: data.enhancedAddress
          };
          
          images.push(imageData);
          
          // Trigger migration for images without enhanced address data
          if (!data.enhancedAddress && data.location?.lat && data.location?.lng) {
            // Run migration in background - don't await to avoid blocking
            migrateImageEnhancedAddress(doc.id, data.location.lat, data.location.lng);
          }
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
