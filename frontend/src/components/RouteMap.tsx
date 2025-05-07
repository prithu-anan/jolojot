import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Route, getSafetyLevel } from '@/utils/routeUtils';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const startIcon = new Icon({ iconUrl: markerIcon, iconSize: [25, 41], iconAnchor: [12, 41] });
const endIcon = new Icon({ iconUrl: markerIcon, iconSize: [25, 41], iconAnchor: [12, 41] });

interface ChangeMapViewProps {
  center: [number, number];
  zoom?: number;
}

const ChangeMapView: React.FC<ChangeMapViewProps> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface RouteMapProps {
  selectedRouteId: string | null;
  userLocation?: { lat: number; lon: number } | null;
  routes?: Route[]; // <-- Make optional
}

const RouteMap: React.FC<RouteMapProps> = ({
  selectedRouteId,
  userLocation,
  routes = [], // ✅ Default value
}) => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    if (selectedRouteId && routes.length > 0) {
      const route = routes.find(r => r.id === selectedRouteId) || null;
      setSelectedRoute(route);
    } else {
      setSelectedRoute(null);
    }
  }, [selectedRouteId, routes]);

  const getMapSettings = (): { center: [number, number]; zoom: number } => {
    if (selectedRoute) {
      const midLat = (selectedRoute.startLocation.lat + selectedRoute.endLocation.lat) / 2;
      const midLon = (selectedRoute.startLocation.lon + selectedRoute.endLocation.lon) / 2;
      let zoom = 13;
      const latDiff = Math.abs(selectedRoute.startLocation.lat - selectedRoute.endLocation.lat);
      const lonDiff = Math.abs(selectedRoute.startLocation.lon - selectedRoute.endLocation.lon);
      const maxDiff = Math.max(latDiff, lonDiff);
      if (maxDiff > 0.5) zoom = 9;
      else if (maxDiff > 0.1) zoom = 11;
      if (
        (selectedRoute.startLocation.name?.toLowerCase().includes('dhaka') &&
         selectedRoute.endLocation.name?.toLowerCase().includes('khulna')) ||
        (selectedRoute.startLocation.name?.toLowerCase().includes('khulna') &&
         selectedRoute.endLocation.name?.toLowerCase().includes('dhaka'))
      ) {
        zoom = 8;
      }
      return { center: [midLat, midLon], zoom };
    }
    if (userLocation) return { center: [userLocation.lat, userLocation.lon], zoom: 13 };
    return { center: [23.685, 90.356], zoom: 7 };
  };

  const getFloodRiskColor = (risk: string) => {
    switch (risk) {
      case 'none': return '#22c55e';
      case 'low': return '#84cc16';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'extreme': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const mapSettings = getMapSettings();

  return (
    <div className="h-full">
      <MapContainer
        center={mapSettings.center}
        zoom={mapSettings.zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeMapView center={mapSettings.center} zoom={mapSettings.zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={startIcon}>
            <Popup><strong>Your Location</strong></Popup>
          </Marker>
        )}

        {selectedRoute && (
          <>
            <Marker
              position={[selectedRoute.startLocation.lat, selectedRoute.startLocation.lon]}
              icon={startIcon}
            >
              <Popup><strong>Start: </strong>{selectedRoute.startLocation.name}</Popup>
            </Marker>
            <Marker
              position={[selectedRoute.endLocation.lat, selectedRoute.endLocation.lon]}
              icon={endIcon}
            >
              <Popup><strong>End: </strong>{selectedRoute.endLocation.name}</Popup>
            </Marker>
            {selectedRoute.segments.map((segment, idx) => (
              <Polyline
                key={idx}
                positions={[
                  [segment.startPoint.lat, segment.startPoint.lon],
                  [segment.endPoint.lat, segment.endPoint.lon]
                ]}
                pathOptions={{
                  color: getFloodRiskColor(segment.floodRisk),
                  weight: 5,
                  opacity: 0.7,
                  dashArray: ['high', 'extreme'].includes(segment.floodRisk) ? '5,10' : ''
                }}
              >
                <Popup>
                  <p><strong>Segment {idx + 1}</strong></p>
                  <p>Road Type: {segment.roadType}</p>
                  <p>Flood Risk: {segment.floodRisk}</p>
                </Popup>
              </Polyline>
            ))}
            {selectedRoute.safetyIssues.map((issue, idx) => issue.location && (
              <Marker
                key={`issue-${idx}`}
                position={[issue.location.lat, issue.location.lon]}
                icon={startIcon}
              >
                <Popup>
                  <strong>{issue.type}</strong><br />
                  {issue.description}<br />
                  Severity: {issue.severity}
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
