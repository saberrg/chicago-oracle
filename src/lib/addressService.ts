/**
 * Enhanced address service for getting more descriptive location information
 */

export interface AddressComponents {
  streetNumber?: string;
  streetName?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
  distanceFromStreet?: number | null; // in meters
}

export interface EnhancedLocationData {
  lat: number;
  lng: number;
  address?: string;
  enhancedAddress?: AddressComponents;
}

/**
 * Get enhanced address information using multiple reverse geocoding services
 */
export async function getEnhancedAddress(lat: number, lng: number): Promise<AddressComponents | null> {
  try {
    // Try multiple services for better results
    const [nominatimResult, bigDataCloudResult] = await Promise.allSettled([
      getNominatimAddress(lat, lng),
      getBigDataCloudAddress(lat, lng)
    ]);

    // Prefer Nominatim for detailed street information
    if (nominatimResult.status === 'fulfilled' && nominatimResult.value) {
      return nominatimResult.value;
    }

    // Fallback to BigDataCloud
    if (bigDataCloudResult.status === 'fulfilled' && bigDataCloudResult.value) {
      return bigDataCloudResult.value;
    }

    return null;
  } catch (error) {
    console.warn('Enhanced address lookup failed:', error);
    return null;
  }
}

/**
 * Get address using Nominatim (OpenStreetMap) - better for street-level details
 */
async function getNominatimAddress(lat: number, lng: number): Promise<AddressComponents | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
    );
    
    if (!response.ok) {
      throw new Error('Nominatim request failed');
    }
    
    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }

    const address = data.address;
    
    return {
      streetNumber: address.house_number,
      streetName: address.road || address.pedestrian || address.footway,
      neighborhood: address.neighbourhood || address.suburb,
      city: address.city || address.town || address.village,
      state: address.state,
      country: address.country,
      postalCode: address.postcode,
      formattedAddress: formatNominatimAddress(address),
      distanceFromStreet: calculateDistanceFromStreet(lat, lng, address)
    };
  } catch (error) {
    console.warn('Nominatim geocoding failed:', error);
    return null;
  }
}

/**
 * Get address using BigDataCloud - good fallback
 */
async function getBigDataCloudAddress(lat: number, lng: number): Promise<AddressComponents | null> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('BigDataCloud request failed');
    }
    
    const data = await response.json();
    
    return {
      city: data.locality,
      state: data.principalSubdivision,
      country: data.countryName,
      formattedAddress: formatBigDataCloudAddress(data),
      distanceFromStreet: null // BigDataCloud doesn't provide street-level data
    };
  } catch (error) {
    console.warn('BigDataCloud geocoding failed:', error);
    return null;
  }
}

/**
 * Format address from Nominatim response
 */
function formatNominatimAddress(address: any): string {
  const parts = [];
  
  // Try to build a street address first
  if (address.house_number && (address.road || address.pedestrian || address.footway)) {
    parts.push(`${address.house_number} ${address.road || address.pedestrian || address.footway}`);
  } else if (address.road || address.pedestrian || address.footway) {
    parts.push(address.road || address.pedestrian || address.footway);
  }
  
  // Add neighborhood/suburb
  if (address.neighbourhood || address.suburb) {
    parts.push(address.neighbourhood || address.suburb);
  }
  
  // Add city
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  
  // Add state
  if (address.state) {
    parts.push(address.state);
  }
  
  // Add country
  if (address.country) {
    parts.push(address.country);
  }
  
  return parts.join(', ');
}

/**
 * Format address from BigDataCloud response
 */
function formatBigDataCloudAddress(data: any): string {
  const parts = [];
  if (data.locality) parts.push(data.locality);
  if (data.principalSubdivision) parts.push(data.principalSubdivision);
  if (data.countryName) parts.push(data.countryName);
  return parts.join(', ');
}

/**
 * Calculate approximate distance from nearest street (rough estimation)
 */
function calculateDistanceFromStreet(lat: number, lng: number, address: any): number | null {
  // This is a simplified calculation - in a real app you might want to use
  // a more sophisticated approach with actual street data
  if (!address.road && !address.pedestrian && !address.footway) {
    return null; // No street information available
  }
  
  // For now, return null as we don't have precise street coordinates
  // In a production app, you'd calculate the actual distance to the nearest street
  return null;
}

/**
 * Get a user-friendly address string with fallback options
 */
export function getDisplayAddress(enhancedAddress: AddressComponents | null, fallbackAddress?: string): string {
  if (!enhancedAddress) {
    return fallbackAddress || 'Location unknown';
  }

  // If we have a street address, use it
  if (enhancedAddress.streetNumber && enhancedAddress.streetName) {
    return `${enhancedAddress.streetNumber} ${enhancedAddress.streetName}`;
  }
  
  // If we have just a street name
  if (enhancedAddress.streetName) {
    return enhancedAddress.streetName;
  }
  
  // If we have neighborhood info
  if (enhancedAddress.neighborhood) {
    return enhancedAddress.neighborhood;
  }
  
  // Fall back to city/state
  if (enhancedAddress.city) {
    return enhancedAddress.city;
  }
  
  // Last resort
  return enhancedAddress.formattedAddress || fallbackAddress || 'Location unknown';
}

/**
 * Get a descriptive location string that works for both street and non-street locations
 */
export function getDescriptiveLocation(enhancedAddress: AddressComponents | null, fallbackAddress?: string): string {
  if (!enhancedAddress) {
    return fallbackAddress || 'Location unknown';
  }

  const parts = [];
  
  // Add street-level info if available
  if (enhancedAddress.streetNumber && enhancedAddress.streetName) {
    parts.push(`${enhancedAddress.streetNumber} ${enhancedAddress.streetName}`);
  } else if (enhancedAddress.streetName) {
    parts.push(enhancedAddress.streetName);
  }
  
  // Add neighborhood for context
  if (enhancedAddress.neighborhood && !parts.includes(enhancedAddress.neighborhood)) {
    parts.push(enhancedAddress.neighborhood);
  }
  
  // Add city
  if (enhancedAddress.city && !parts.includes(enhancedAddress.city)) {
    parts.push(enhancedAddress.city);
  }
  
  // Add state if different from city
  if (enhancedAddress.state && !parts.includes(enhancedAddress.state)) {
    parts.push(enhancedAddress.state);
  }
  
  // If we have no street info, add some context
  if (parts.length === 0 && enhancedAddress.formattedAddress) {
    return enhancedAddress.formattedAddress;
  }
  
  return parts.length > 0 ? parts.join(', ') : (fallbackAddress || 'Location unknown');
}
