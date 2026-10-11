import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default Leaflet marker icons reference bundled image paths that don't
// resolve correctly under Vite — replace with a simple inline SVG pin in
// the brand's gold, rather than fighting the bundler over asset URLs.
const pinIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:26px;height:26px;background:#F4A340;border:2px solid #0B1E3D;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(11,30,61,0.4);"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

export default function LeafletMap({ lat, lng, label, markers, zoom = 13, height = 320, className = '' }) {
  const points = markers?.length ? markers : lat != null && lng != null ? [{ lat, lng, label }] : [];

  if (points.length === 0) return null;

  const center = [points[0].lat, points[0].lng];

  return (
    <div className={`overflow-hidden rounded-lg border border-border dark:border-indigo-800 ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={pinIcon}>
            {p.label && <Popup>{p.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
