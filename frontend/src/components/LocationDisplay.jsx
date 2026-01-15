import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { reverseGeocode } from '@/utils/geocoding';

export default function LocationDisplay({ lat, lng, className = '' }) {
  const [locationName, setLocationName] = useState('Loading...');

  useEffect(() => {
    if (lat && lng) {
      reverseGeocode(lat, lng).then(setLocationName);
    } else {
      setLocationName('Location not available');
    }
  }, [lat, lng]);

  if (!lat || !lng) return null;

  return (
    <div className={`flex items-center gap-1 text-xs text-slate-500 ${className}`}>
      <MapPin className="h-3 w-3" />
      <span>{locationName}</span>
    </div>
  );
}