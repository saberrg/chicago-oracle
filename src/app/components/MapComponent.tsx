'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ImageData } from '@/types/image';

interface MapComponentProps {
  image: ImageData;
}

// Component to handle map resize
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    // Force map to resize and invalidate size
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  return null;
}

export default function MapComponent({ image }: MapComponentProps) {
  useEffect(() => {
    // Fix for default markers in react-leaflet
    delete (Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[image.location.lat, image.location.lng]}
        zoom={15}
        style={{ 
          height: '100%', 
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <MapResizeHandler />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[image.location.lat, image.location.lng]}>
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold text-sm mb-2">{image.title}</h3>
              <img 
                src={image.src} 
                alt={image.alt}
                className="w-20 h-20 object-cover rounded mx-auto"
              />
              {image.location.address && (
                <p className="text-xs text-gray-600 mt-2">{image.location.address}</p>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
