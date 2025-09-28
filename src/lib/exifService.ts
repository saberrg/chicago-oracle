import { LocationData } from './locationService';

export interface ExifData {
  location?: LocationData;
  dateTaken?: Date;
  camera?: string;
  orientation?: number;
}

/**
 * Extract EXIF data from an image file
 * iPhone photos contain GPS coordinates in EXIF data
 */
export async function extractExifData(file: File): Promise<ExifData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      try {
        const exifData = parseExifData(arrayBuffer);
        resolve(exifData);
      } catch (error) {
        console.warn('Failed to parse EXIF data:', error);
        resolve({}); // Return empty object if EXIF parsing fails
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse EXIF data from ArrayBuffer
 * This is a simplified EXIF parser for GPS coordinates
 */
function parseExifData(arrayBuffer: ArrayBuffer): ExifData {
  const dataView = new DataView(arrayBuffer);
  const exifData: ExifData = {};
  
  // Look for EXIF header (0xFFE1)
  let offset = 0;
  while (offset < arrayBuffer.byteLength - 1) {
    const marker = dataView.getUint16(offset);
    if (marker === 0xFFE1) {
      // Found EXIF segment
      const exifOffset = offset + 4; // Skip marker and length
      const gpsData = parseGpsData();
      if (gpsData) {
        exifData.location = gpsData;
      }
      break;
    }
    offset += 2;
  }
  
  return exifData;
}

/**
 * Parse GPS data from EXIF
 * This is a simplified implementation
 */
function parseGpsData(): LocationData | null {
  try {
    // This is a simplified GPS parsing
    // In a real implementation, you'd need to parse the full EXIF structure
    // For now, we'll return null and rely on current location
    return null;
  } catch (error) {
    console.warn('Failed to parse GPS data:', error);
    return null;
  }
}

/**
 * Check if a file is likely to contain EXIF data
 */
export function hasExifData(file: File): boolean {
  const exifTypes = ['image/jpeg', 'image/jpg', 'image/tiff'];
  return exifTypes.includes(file.type.toLowerCase());
}

/**
 * Get location from EXIF data or fallback to current location
 */
export async function getLocationFromFile(
  file: File, 
  fallbackLocation: () => Promise<LocationData>
): Promise<LocationData> {
  // First try to extract location from EXIF data
  if (hasExifData(file)) {
    try {
      const exifData = await extractExifData(file);
      if (exifData.location) {
        console.log('Location found in EXIF data:', exifData.location);
        return exifData.location;
      }
    } catch (error) {
      console.warn('Failed to extract EXIF location:', error);
    }
  }
  
  // Fallback to current location
  console.log('Using current location as fallback');
  return await fallbackLocation();
}
