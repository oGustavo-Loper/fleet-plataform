import { useEffect, useRef, type CSSProperties } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default marker icon references relative paths that break once
// bundled (Vite hashes/moves the asset files) — point it at the actual
// bundled URLs instead.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const DEFAULT_CENTER: [number, number] = [-14.235, -51.9253]; // Brazil, roughly centered
const DEFAULT_ZOOM = 4;
const PICKED_ZOOM = 16;

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
};

/**
 * Draggable-pin picker for the fueling location. GPS capture (elsewhere in
 * the form) can set an initial point; this lets the driver drag the marker
 * or click the map to correct it, since GPS alone is often off by enough to
 * land on the wrong side of the street/an adjacent lot.
 */
export function FuelLocationPicker({ latitude, longitude, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const hasPoint = latitude != null && longitude != null;
    const initialCenter: [number, number] = hasPoint ? [latitude, longitude] : DEFAULT_CENTER;

    const map = L.map(containerRef.current).setView(initialCenter, hasPoint ? PICKED_ZOOM : DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const marker = L.marker(initialCenter, { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      onChangeRef.current(position.lat, position.lng);
    });
    map.on("click", (event: L.LeafletMouseEvent) => {
      marker.setLatLng(event.latlng);
      onChangeRef.current(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once; latitude/longitude changes after mount are
    // handled by the sync effect below instead of re-creating the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || latitude == null || longitude == null) {
      return;
    }

    const current = marker.getLatLng();
    // Skip redundant updates (e.g. the position this same picker just
    // reported via drag/click) so we don't re-center under the user's
    // cursor mid-interaction — only external changes (GPS capture) should
    // move the view.
    if (Math.abs(current.lat - latitude) < 1e-9 && Math.abs(current.lng - longitude) < 1e-9) {
      return;
    }

    marker.setLatLng([latitude, longitude]);
    map.setView([latitude, longitude], Math.max(map.getZoom(), PICKED_ZOOM));
  }, [latitude, longitude]);

  return <div ref={containerRef} style={mapContainerStyle} />;
}

const mapContainerStyle: CSSProperties = {
  width: "100%",
  height: "260px",
  borderRadius: "0.85rem",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  overflow: "hidden"
};
