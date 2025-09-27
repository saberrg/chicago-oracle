export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export interface LocationError {
  code: number;
  message: string;
}

/**
 * Get user's current location using browser geolocation API
 */
export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get address using reverse geocoding
          const address = await reverseGeocode(latitude, longitude);
          
          resolve({
            lat: latitude,
            lng: longitude,
            address
          });
        } catch (error) {
          // If reverse geocoding fails, still return coordinates
          resolve({
            lat: latitude,
            lng: longitude
          });
        }
      },
      (error) => {
        const locationError: LocationError = {
          code: error.code,
          message: getLocationErrorMessage(error.code)
        };
        reject(locationError);
      },
      options
    );
  });
}

/**
 * Reverse geocoding to get address from coordinates
 * Using a free service - you can replace with Google Maps API if needed
 */
async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    // Format address from the response
    const parts = [];
    if (data.locality) parts.push(data.locality);
    if (data.principalSubdivision) parts.push(data.principalSubdivision);
    if (data.countryName) parts.push(data.countryName);
    
    return parts.length > 0 ? parts.join(', ') : undefined;
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return undefined;
  }
}

/**
 * Get user-friendly error message for geolocation errors
 */
function getLocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location access denied. Please enable location permissions and try again.';
    case 2:
      return 'Location unavailable. Please check your connection and try again.';
    case 3:
      return 'Location request timed out. Please try again.';
    default:
      return 'Unable to get your location. Please try again.';
  }
}

/**
 * Check if geolocation is supported
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Request location permission and get current location
 * This is a more user-friendly wrapper that handles permission requests
 */
export async function requestLocationPermission(): Promise<LocationData> {
  if (!isGeolocationSupported()) {
    throw {
      code: 0,
      message: 'Geolocation is not supported by this browser'
    };
  }

  try {
    // First, try to get permission
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    
    if (permission.state === 'denied') {
      throw {
        code: 1,
        message: 'Location access denied. Please enable location permissions in your browser settings.'
      };
    }
    
    // Get the actual location
    return await getCurrentLocation();
  } catch (error) {
    // If permission query fails, try direct geolocation
    return await getCurrentLocation();
  }
}

/**
 * Calculate distance between two points in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
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
