import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CampusLocation, SOSRequest, User } from '../types';
import { MapPin, Navigation, Layers, ShieldAlert, HeartPulse, Shield, BookOpen, Utensils, Home, Zap } from 'lucide-react';

interface CampusMapProps {
  locations?: CampusLocation[];
  activeSOSList?: SOSRequest[];
  studentLocation?: { lat: number; lng: number };
  responders?: User[];
  onSelectCoordinates?: (coords: { lat: number; lng: number }) => void;
  selectedLocationId?: string;
  height?: string;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  locations = [],
  activeSOSList = [],
  studentLocation = { lat: 17.4206, lng: 78.6558 },
  responders = [],
  onSelectCoordinates,
  selectedLocationId,
  height = '520px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedPin, setSelectedPin] = useState<any>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on Anurag University campus
    const map = L.map(mapContainerRef.current, {
      center: [studentLocation.lat, studentLocation.lng],
      zoom: 17,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark sleek OpenStreetMap tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Handle map clicks (for Admin coordinate selection)
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onSelectCoordinates) {
        onSelectCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when data or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Student Marker (Pulsing Cyan Orb)
    if (studentLocation) {
      const studentIcon = L.divIcon({
        className: 'custom-student-pin',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
            <div class="relative w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-lg shadow-cyan-500/50 flex items-center justify-center text-[10px] font-extrabold text-slate-950">
              ME
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const studentMarker = L.marker([studentLocation.lat, studentLocation.lng], { icon: studentIcon })
        .bindPopup(`
          <div class="p-1 font-sans">
            <div class="font-bold text-xs text-cyan-700">📍 Your Current Position</div>
            <div class="text-[11px] text-slate-600">GPS Locked (Within Anurag University Campus)</div>
          </div>
        `);
      markersLayerRef.current.addLayer(studentMarker);
    }

    // 2. Active SOS Markers (Urgent Red Pulsing Emergency Marker)
    activeSOSList.forEach((sos) => {
      const [lng, lat] = sos.location.coordinates;
      const sosIcon = L.divIcon({
        className: 'custom-sos-pin',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-80"></span>
            <div class="relative w-8 h-8 rounded-2xl bg-rose-600 border-2 border-white shadow-xl shadow-rose-600/80 flex items-center justify-center text-white font-extrabold text-xs">
              🚨
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const sosMarker = L.marker([lat, lng], { icon: sosIcon });
      sosMarker.on('click', () => {
        setSelectedPin({ type: 'SOS', data: sos });
      });

      markersLayerRef.current?.addLayer(sosMarker);
    });

    // 3. Campus Locations (Filtered)
    const filteredLocations = locations.filter((loc) => {
      if (selectedFilter === 'All') return true;
      return loc.type.toLowerCase() === selectedFilter.toLowerCase();
    });

    filteredLocations.forEach((loc) => {
      const [lng, lat] = loc.location.coordinates;

      let color = 'bg-slate-700 border-slate-500 text-white';
      let emoji = '📍';

      switch (loc.type) {
        case 'Medical':
          color = 'bg-rose-600 border-rose-300 text-white shadow-rose-500/40';
          emoji = '🏥';
          break;
        case 'Security':
          color = 'bg-blue-600 border-blue-300 text-white shadow-blue-500/40';
          emoji = '🛡️';
          break;
        case 'Library':
          color = 'bg-purple-600 border-purple-300 text-white shadow-purple-500/40';
          emoji = '📚';
          break;
        case 'AED':
          color = 'bg-amber-600 border-amber-300 text-white shadow-amber-500/40';
          emoji = '⚡';
          break;
        case 'Hostel':
          color = 'bg-indigo-600 border-indigo-300 text-white';
          emoji = '🏢';
          break;
        case 'Canteen':
          color = 'bg-emerald-600 border-emerald-300 text-white';
          emoji = '🍽️';
          break;
        case 'Lab':
          color = 'bg-cyan-600 border-cyan-300 text-white';
          emoji = '🔬';
          break;
      }

      const locIcon = L.divIcon({
        className: 'custom-loc-pin',
        html: `
          <div class="w-7 h-7 rounded-xl ${color} border-2 shadow-lg flex items-center justify-center text-xs hover:scale-110 transition-transform">
            ${emoji}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon: locIcon });
      marker.on('click', () => {
        setSelectedPin({ type: 'LOCATION', data: loc });
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // 4. Available Responders (Green Shield Pin)
    responders.forEach((r) => {
      if (r.currentLocation?.coordinates) {
        const [rLng, rLat] = r.currentLocation.coordinates;
        const respIcon = L.divIcon({
          className: 'custom-resp-pin',
          html: `
            <div class="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-xs text-slate-950 font-bold">
              👤
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const rMarker = L.marker([rLat, rLng], { icon: respIcon });
        rMarker.on('click', () => {
          setSelectedPin({ type: 'RESPONDER', data: r });
        });
        markersLayerRef.current?.addLayer(rMarker);
      }
    });
  }, [locations, activeSOSList, studentLocation, responders, selectedFilter]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && studentLocation) {
      mapInstanceRef.current.flyTo([studentLocation.lat, studentLocation.lng], 18, { duration: 1.2 });
    }
  };

  const categories = ['All', 'Medical', 'Security', 'Library', 'AED', 'Hostel', 'Canteen', 'Lab'];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Top Filter Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-800 shadow-xl pointer-events-auto overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recenter button */}
        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 text-cyan-400 hover:text-white hover:bg-cyan-950 shadow-xl pointer-events-auto transition-all"
          title="Recenter on my location"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Leaflet Map DOM Element */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Selected Location / SOS Bottom Sheet */}
      {selectedPin && (
        <div className="absolute bottom-3 left-3 right-3 z-[400] max-w-md mx-auto p-4 rounded-3xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                  selectedPin.type === 'SOS'
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : selectedPin.type === 'RESPONDER'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}
              >
                {selectedPin.type === 'SOS'
                  ? `🚨 Emergency: ${selectedPin.data.type}`
                  : selectedPin.type === 'RESPONDER'
                  ? `Responder: ${selectedPin.data.role}`
                  : selectedPin.data.type}
              </span>
              <h4 className="text-sm font-extrabold text-white mt-1">
                {selectedPin.type === 'SOS'
                  ? selectedPin.data.userName
                  : selectedPin.type === 'RESPONDER'
                  ? selectedPin.data.name
                  : selectedPin.data.name}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                {selectedPin.type === 'SOS'
                  ? selectedPin.data.description || 'Immediate dispatch requested'
                  : selectedPin.type === 'RESPONDER'
                  ? `Department: ${selectedPin.data.department || 'Campus Safety Taskforce'}`
                  : selectedPin.data.description}
              </p>
              {selectedPin.data.distanceFormatted && (
                <div className="text-xs font-semibold text-cyan-400 mt-1">
                  📍 Approximately {selectedPin.data.distanceFormatted} from your current position
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {selectedPin.data.hours ? `Hours: ${selectedPin.data.hours}` : 'Campus Security Area'}
            </span>
            {selectedPin.data.contact && (
              <a
                href={`tel:${selectedPin.data.contact}`}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all"
              >
                Call {selectedPin.data.contact}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
