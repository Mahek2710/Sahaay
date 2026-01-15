import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoibmF2eWEyNCIsImEiOiJjbWs5cjBsYW0xajJ6M2dxczNsZG1wdnoxIn0.EPzshEIrj1MTOcKz7i0T1w';

export default function MapboxMap({
  incidents = [],
  resources = [],
  initialLocation = null,
  interactive = false,
  onIncidentClick = null,
  onLocationSelect = null,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const locationMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  /* ---------------- INIT MAP ---------------- */
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [77.2090, 28.6139],
      zoom: 11,
    });

    mapRef.current.on('load', () => setMapLoaded(true));

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /* ---------------- AUTO GPS (CITIZEN PORTAL ONLY) ---------------- */
  useEffect(() => {
    if (!interactive || !mapLoaded || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });

        locationMarkerRef.current?.remove();

        locationMarkerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        onLocationSelect?.(lat, lng);
      },
      () => console.warn('GPS permission denied'),
      { enableHighAccuracy: true }
    );
  }, [interactive, mapLoaded, onLocationSelect]);

  /* ---------------- INITIAL LOCATION (ONLY IF PROVIDED & NON-INTERACTIVE) ---------------- */
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || interactive || !initialLocation) return;

    mapRef.current.flyTo({
      center: [initialLocation.lng, initialLocation.lat],
      zoom: 15,
    });
  }, [initialLocation, mapLoaded, interactive]);

  /* ---------------- INCIDENT + RESOURCE MARKERS ---------------- */
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || interactive) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    /* -------- INCIDENT MARKERS -------- */
    incidents.forEach((incident) => {
      if (
        !incident.location ||
        typeof incident.location.lat !== 'number' ||
        typeof incident.location.lng !== 'number'
      ) return;

      let color = '#3b82f6';
      if (incident.severity === 'Critical') color = '#dc2626';
      else if (incident.severity === 'High') color = '#f97316';
      else if (incident.severity === 'Medium') color = '#facc15';

      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([incident.location.lng, incident.location.lat])
        .addTo(mapRef.current);

      if (onIncidentClick) el.onclick = () => onIncidentClick(incident);

      markersRef.current.push(marker);
      bounds.extend([incident.location.lng, incident.location.lat]);
    });

    /* -------- RESOURCE MARKERS -------- */
    resources.forEach((resource) => {
      if (
        !resource.location ||
        typeof resource.location.lat !== 'number' ||
        typeof resource.location.lng !== 'number'
      ) return;

      const color =
        resource.status === 'Deployed' ? '#10b981' : '#2563eb';

      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([resource.location.lng, resource.location.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
      bounds.extend([resource.location.lng, resource.location.lat]);
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }
  }, [incidents, resources, mapLoaded, interactive, onIncidentClick]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
