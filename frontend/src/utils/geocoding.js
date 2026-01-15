// Reverse geocoding utility using Mapbox Geocoding API
const MAPBOX_TOKEN = 'pk.eyJ1IjoibmF2eWEyNCIsImEiOiJjbWs5cjBsYW0xajJ6M2dxczNsZG1wdnoxIn0.EPzshEIrj1MTOcKz7i0T1w';

// Cache for location names to avoid repeated API calls
const locationCache = new Map();

export async function reverseGeocode(lat, lng) {
  if (!lat || !lng) return 'Location not available';
  
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  
  if (locationCache.has(key)) {
    return locationCache.get(key);
  }
  
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    
    let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // Prefer place name, fallback to text
      locationName = feature.place_name || feature.text || locationName;
    }
    
    locationCache.set(key, locationName);
    return locationName;
  } catch (error) {
    console.warn('Geocoding failed:', error);
    const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    locationCache.set(key, fallback);
    return fallback;
  }
}