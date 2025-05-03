import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { findSafeRoutes, Route, RoutePoint, getSafetyLevel } from '@/utils/routeUtils';

// Fix for default marker icons in Leaflet with webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icons for different types of markers
const startIcon = new Icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'text-safety-safe', // Using Tailwind classes
});

const endIcon = new Icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'text-primary',
});

// Change view component to update map when center changes
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
}

const RouteMap: React.FC<RouteMapProps> = ({ selectedRouteId, userLocation }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // When the selectedRouteId changes, find the matching route
  useEffect(() => {
    if (selectedRouteId && routes.length > 0) {
      const route = routes.find(r => r.id === selectedRouteId) || null;
      setSelectedRoute(route);
    } else {
      setSelectedRoute(null);
    }
  }, [selectedRouteId, routes]);

  // Calculate appropriate map center and zoom when a route is selected
  const getMapSettings = (): { center: [number, number], zoom: number } => {
    // If there's a selected route, center on the midpoint of the route
    if (selectedRoute) {
      // Calculate the midpoint between start and end locations
      const midLat = (selectedRoute.startLocation.lat + selectedRoute.endLocation.lat) / 2;
      const midLon = (selectedRoute.startLocation.lon + selectedRoute.endLocation.lon) / 2;
      
      // Calculate the distance between points to determine zoom level
      const latDiff = Math.abs(selectedRoute.startLocation.lat - selectedRoute.endLocation.lat);
      const lonDiff = Math.abs(selectedRoute.startLocation.lon - selectedRoute.endLocation.lon);
      const maxDiff = Math.max(latDiff, lonDiff);
      
      // Determine appropriate zoom level based on distance
      // Lower zoom number means more zoomed out
      let zoom = 13; // default (city level)
      
      if (maxDiff > 0.5) zoom = 9;     // Major city to city route
      else if (maxDiff > 0.1) zoom = 11; // Medium distance
      
      // For Dhaka-Khulna specific route
      if ((selectedRoute.startLocation.name?.toLowerCase().includes('dhaka') && 
           selectedRoute.endLocation.name?.toLowerCase().includes('khulna')) ||
          (selectedRoute.startLocation.name?.toLowerCase().includes('khulna') && 
           selectedRoute.endLocation.name?.toLowerCase().includes('dhaka'))) {
        zoom = 8; // Zoom out further for this long route
      }
      
      return { center: [midLat, midLon], zoom };
    }
    
    // If user location is available, center on that
    if (userLocation) {
      return { center: [userLocation.lat, userLocation.lon], zoom: 13 };
    }
    
    // Default center on Bangladesh
    return { center: [23.685, 90.356], zoom: 7 }; 
  };

  // Get map settings
  const mapSettings = getMapSettings();

  // Load initial dummy routes when component mounts
  useEffect(() => {
    const loadInitialRoutes = async () => {
      setIsLoading(true);
      try {
        // Loading routes for Bangladesh cities instead of NYC
        const dummyRoutes = await findSafeRoutes(
          "Dhaka",
          "Khulna"
        );
        setRoutes(dummyRoutes);
        
        // Optionally set the first route as selected
        if (dummyRoutes.length > 0 && !selectedRouteId) {
          setSelectedRoute(dummyRoutes[0]);
        }
      } catch (error) {
        console.error('Error loading routes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialRoutes();
  }, []);

  // Get color based on flood risk
  const getFloodRiskColor = (
    floodRisk: 'none' | 'low' | 'medium' | 'high' | 'extreme'
  ): string => {
    switch (floodRisk) {
      case 'none': return '#22c55e'; // Green
      case 'low': return '#84cc16'; // Light green
      case 'medium': return '#f59e0b'; // Amber
      case 'high': return '#f97316'; // Orange
      case 'extreme': return '#ef4444'; // Red
      default: return '#3b82f6'; // Blue
    }
  };

  // Get color for safety score
  const getSafetyScoreColor = (safetyScore: number): string => {
    const safetyLevel = getSafetyLevel(safetyScore);
    switch (safetyLevel) {
      case 'safe': return '#22c55e'; // Green
      case 'warning': return '#f59e0b'; // Amber
      case 'danger': return '#ef4444'; // Red
      default: return '#3b82f6'; // Blue
    }
  };
  
  // Function to convert a route to polyline points
  const getRoutePolyline = (route: Route): [number, number][] => {
    const points: [number, number][] = [
      [route.startLocation.lat, route.startLocation.lon]
    ];
    
    route.segments.forEach(segment => {
      // Add midpoint of segment
      points.push([
        (segment.startPoint.lat + segment.endPoint.lat) / 2,
        (segment.startPoint.lon + segment.endPoint.lon) / 2
      ]);
    });
    
    points.push([route.endLocation.lat, route.endLocation.lon]);
    
    return points;
  };
  
  // Simple map view when loading
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <MapContainer
        center={mapSettings.center}
        zoom={mapSettings.zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* This component updates map center when user location changes */}
        <ChangeMapView center={mapSettings.center} zoom={mapSettings.zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Add a marker for the user's current location if available */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={new Icon({
              iconUrl: markerIcon,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              className: 'text-blue-500'
            })}
          >
            <Popup>
              <div className="p-1">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Draw selected route */}
        {selectedRoute && (
          <>
            {/* Route start marker */}
            <Marker 
              position={[selectedRoute.startLocation.lat, selectedRoute.startLocation.lon]}
              icon={startIcon}
            >
              <Popup>
                <div className="p-1">
                  <strong>Start: </strong>
                  {selectedRoute.startLocation.name || 'Starting Point'}
                </div>
              </Popup>
            </Marker>
            
            {/* Route end marker */}
            <Marker 
              position={[selectedRoute.endLocation.lat, selectedRoute.endLocation.lon]}
              icon={endIcon}
            >
              <Popup>
                <div className="p-1">
                  <strong>End: </strong>
                  {selectedRoute.endLocation.name || 'Destination'}
                </div>
              </Popup>
            </Marker>
            
            {/* Route segments */}
            {selectedRoute.segments.map((segment, index) => (
              <React.Fragment key={index}>
                <Polyline 
                  positions={[
                    [segment.startPoint.lat, segment.startPoint.lon],
                    [segment.endPoint.lat, segment.endPoint.lon]
                  ]}
                  pathOptions={{ 
                    color: getFloodRiskColor(segment.floodRisk),
                    weight: 5,
                    opacity: 0.7,
                    dashArray: segment.floodRisk === 'high' || segment.floodRisk === 'extreme' ? '5, 10' : ''
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <p><strong>Segment {index + 1}</strong></p>
                      <p>Road Type: {segment.roadType}</p>
                      <p>Flood Risk: {segment.floodRisk}</p>
                    </div>
                  </Popup>
                </Polyline>
              </React.Fragment>
            ))}
            
            {/* Safety issues markers */}
            {selectedRoute.safetyIssues.map((issue, index) => {
              if (issue.location) {
                return (
                  <Marker
                    key={`issue-${index}`}
                    position={[issue.location.lat, issue.location.lon]}
                    icon={new Icon({
                      iconUrl: markerIcon,
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      className: issue.severity === 'danger' ? 'text-destructive' : 
                               issue.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                    })}
                  >
                    <Popup>
                      <div className="p-1">
                        <p><strong>{issue.type}</strong></p>
                        <p>{issue.description}</p>
                        <p>Severity: {issue.severity}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </>
        )}
        
        {/* Show all routes if none is selected */}
        {!selectedRoute && routes.map((route) => (
          <Polyline 
            key={route.id}
            positions={getRoutePolyline(route)}
            pathOptions={{ 
              color: getSafetyScoreColor(route.safetyScore),
              weight: 4,
              opacity: 0.6
            }}
          >
            <Popup>
              <div className="p-1">
                <p><strong>{route.name}</strong></p>
                <p>Safety Score: {route.safetyScore}/100</p>
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
