
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

// Component to recenter map on route changes
const MapRecenter = ({ route }: { route: Route | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (route) {
      const bounds = [
        [route.startLocation.lat, route.startLocation.lon],
        [route.endLocation.lat, route.endLocation.lon],
      ] as [number, number][];
      
      // Add segment points to bounds
      route.segments.forEach(segment => {
        bounds.push([segment.startPoint.lat, segment.startPoint.lon]);
        bounds.push([segment.endPoint.lat, segment.endPoint.lon]);
      });
      
      map.fitBounds(bounds);
    }
  }, [route, map]);
  
  return null;
};

interface RouteMapProps {
  selectedRouteId: string | null;
}

const RouteMap: React.FC<RouteMapProps> = ({ selectedRouteId }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Default center (NYC area)
  const defaultCenter: [number, number] = [40.7128, -74.006];
  
  // When the selectedRouteId changes, find the matching route
  useEffect(() => {
    if (selectedRouteId && routes.length > 0) {
      const route = routes.find(r => r.id === selectedRouteId) || null;
      setSelectedRoute(route);
    } else {
      setSelectedRoute(null);
    }
  }, [selectedRouteId, routes]);

  // Load initial dummy routes when component mounts
  useEffect(() => {
    const loadInitialRoutes = async () => {
      setIsLoading(true);
      try {
        // Loading some dummy data (NYC area)
        const dummyRoutes = await findSafeRoutes(
          { lat: 40.7128, lon: -74.006, name: 'New York City' },
          { lat: 40.7645, lon: -73.9779, name: 'Manhattan' }
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
  
  return (
    <div className="h-full">
      {isLoading ? (
        <div className="h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      ) : (
        <MapContainer
          center={defaultCenter}
          zoom={11}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Recenter map when route changes */}
          {selectedRoute && <MapRecenter route={selectedRoute} />}
          
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
      )}
    </div>
  );
};

export default RouteMap;
