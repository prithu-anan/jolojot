import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  findSafeRoutes,
  Route,
  RoutePoint,
  getSafetyLevel,
} from "@/utils/routeUtils";

// Fix for default marker icons in Leaflet with webpack
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix _getIconUrl issue in Leaflet
interface DefaultIconType extends Icon.Default {
  _getIconUrl?: () => string;
}

delete (Icon.Default.prototype as DefaultIconType)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Define custom event types
interface RouteUpdateEvent extends CustomEvent {
  detail: {
    routes: Route[];
  };
}

// Custom icons for different types of markers
const startIcon = new Icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "text-safety-safe", // Using Tailwind classes
});

const endIcon = new Icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "text-primary",
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

const RouteMap: React.FC<RouteMapProps> = ({
  selectedRouteId,
  userLocation,
}) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // When the selectedRouteId changes, find the matching route
  useEffect(() => {
    const fetchSelectedRoute = async () => {
      // If no route ID is selected, clear the selected route
      if (!selectedRouteId) {
        setSelectedRoute(null);
        return;
      }

      // First check if we already have this route
      const existingRoute = routes.find((r) => r.id === selectedRouteId);
      if (existingRoute) {
        setSelectedRoute(existingRoute);
        return;
      }

      // If we don't have the route locally, try to fetch routes
      // This is a fallback and shouldn't typically be needed since
      // routes should be loaded by the RoutePlanner component
      setIsLoading(true);
      try {
        // Wait for RouteSearch to populate routes
        // We'll implement a waiting strategy instead of fetching hardcoded routes
        const waitTime = 100;
        const maxAttempts = 50; // 5 seconds max wait
        let attempts = 0;

        const checkForRoutes = async () => {
          const updatedRoutes = routes;
          const foundRoute = updatedRoutes.find(
            (r) => r.id === selectedRouteId
          );

          if (foundRoute) {
            setSelectedRoute(foundRoute);
            setIsLoading(false);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkForRoutes, waitTime);
          } else {
            // Timeout - couldn't find the route
            console.error("Timeout waiting for route data");
            setIsLoading(false);
          }
        };

        checkForRoutes();
      } catch (error) {
        console.error("Error finding selected route:", error);
        setIsLoading(false);
      }
    };

    fetchSelectedRoute();
  }, [selectedRouteId, routes]);

  // Calculate appropriate map center and zoom when a route is selected
  const getMapSettings = (): { center: [number, number]; zoom: number } => {
    // If there's a selected route, center on the midpoint of the route
    if (selectedRoute) {
      // Calculate the midpoint between start and end locations
      const midLat =
        (selectedRoute.startLocation.lat + selectedRoute.endLocation.lat) / 2;
      const midLon =
        (selectedRoute.startLocation.lon + selectedRoute.endLocation.lon) / 2;

      // Calculate the distance between points to determine zoom level
      const latDiff = Math.abs(
        selectedRoute.startLocation.lat - selectedRoute.endLocation.lat
      );
      const lonDiff =
        Math.abs(
          selectedRoute.startLocation.lon - selectedRoute.endLocation.lon
        ) * 1.2; // Adjust for longitude at Bangladesh's latitude
      const maxDiff = Math.max(latDiff, lonDiff);

      // Determine appropriate zoom level based on distance
      // Lower zoom number means more zoomed out
      let zoom = 13; // default (city level)

      if (maxDiff > 2) zoom = 7; // Very long distance
      else if (maxDiff > 1) zoom = 8; // Long distance
      else if (maxDiff > 0.5) zoom = 9; // Major city to city route
      else if (maxDiff > 0.2) zoom = 10; // Medium-long distance
      else if (maxDiff > 0.1) zoom = 11; // Medium distance

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

  // Store the routes in state when they get loaded by the parent
  useEffect(() => {
    // Subscribe to route update events from the RoutePlanner component
    const handleRouteUpdate = (event: RouteUpdateEvent) => {
      if (
        event.detail &&
        event.detail.routes &&
        event.detail.routes.length > 0
      ) {
        // Only update if the routes have actually changed to avoid unnecessary rerenders
        const newRouteIds = event.detail.routes
          .map((r) => r.id)
          .sort()
          .join(",");
        const currentRouteIds = routes
          .map((r) => r.id)
          .sort()
          .join(",");

        if (newRouteIds !== currentRouteIds) {
          setRoutes(event.detail.routes);

          // If a route is already selected, try to find its match in the new routes
          if (selectedRouteId) {
            const matchingRoute = event.detail.routes.find(
              (r) => r.id === selectedRouteId
            );
            if (matchingRoute) {
              setSelectedRoute(matchingRoute);
            }
          }
        }
      }
    };

    // Add event listener for custom route-update event
    window.addEventListener("route-update", handleRouteUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener(
        "route-update",
        handleRouteUpdate as EventListener
      );
    };
  }, [routes, selectedRouteId]);

  // Get color based on flood risk
  const getFloodRiskColor = (
    floodRisk: "none" | "low" | "medium" | "high" | "extreme"
  ): string => {
    switch (floodRisk) {
      case "none":
        return "#22c55e"; // Green
      case "low":
        return "#84cc16"; // Light green
      case "medium":
        return "#f59e0b"; // Amber
      case "high":
        return "#f97316"; // Orange
      case "extreme":
        return "#ef4444"; // Red
      default:
        return "#3b82f6"; // Blue
    }
  };

  // Get color for safety score
  const getSafetyScoreColor = (safetyScore: number): string => {
    const safetyLevel = getSafetyLevel(safetyScore);
    switch (safetyLevel) {
      case "safe":
        return "#22c55e"; // Green
      case "warning":
        return "#f59e0b"; // Amber
      case "danger":
        return "#ef4444"; // Red
      default:
        return "#3b82f6"; // Blue
    }
  };

  // Function to convert a route to polyline points
  const getRoutePolyline = (route: Route): [number, number][] => {
    const points: [number, number][] = [
      [route.startLocation.lat, route.startLocation.lon],
    ];

    route.segments.forEach((segment) => {
      // Add midpoint of segment
      points.push([
        (segment.startPoint.lat + segment.endPoint.lat) / 2,
        (segment.startPoint.lon + segment.endPoint.lon) / 2,
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
        style={{ height: "100%", width: "100%" }}
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
            icon={
              new Icon({
                iconUrl: markerIcon,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                className: "text-blue-500",
              })
            }
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
              position={[
                selectedRoute.startLocation.lat,
                selectedRoute.startLocation.lon,
              ]}
              icon={startIcon}
            >
              <Popup>
                <div className="p-1">
                  <strong>Start: </strong>
                  {selectedRoute.startLocation.name || "Starting Point"}
                </div>
              </Popup>
            </Marker>

            {/* Route end marker */}
            <Marker
              position={[
                selectedRoute.endLocation.lat,
                selectedRoute.endLocation.lon,
              ]}
              icon={endIcon}
            >
              <Popup>
                <div className="p-1">
                  <strong>Destination: </strong>
                  {selectedRoute.endLocation.name || "Destination"}
                </div>
              </Popup>
            </Marker>

            {/* Visualize all segments of the route */}
            {selectedRoute.segments.map((segment, index) => (
              <React.Fragment key={index}>
                {/* Draw polyline for the segment */}
                <Polyline
                  positions={[
                    [segment.startPoint.lat, segment.startPoint.lon],
                    [segment.endPoint.lat, segment.endPoint.lon],
                  ]}
                  pathOptions={{
                    color: getFloodRiskColor(segment.floodRisk),
                    weight: 5,
                    opacity: 0.7,
                    dashArray:
                      segment.floodRisk === "extreme" ||
                      segment.floodRisk === "high"
                        ? "5, 10"
                        : undefined,
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <strong>Segment {index + 1}</strong>
                      <br />
                      Flood Risk: {segment.floodRisk}
                      <br />
                      Road Type: {segment.roadType}
                      <br />
                      Distance: {(segment.distance / 1000).toFixed(1)} km
                    </div>
                  </Popup>
                </Polyline>

                {/* For high risk areas, add a warning marker */}
                {(segment.floodRisk === "high" ||
                  segment.floodRisk === "extreme") && (
                  <Marker
                    position={[
                      (segment.startPoint.lat + segment.endPoint.lat) / 2,
                      (segment.startPoint.lon + segment.endPoint.lon) / 2,
                    ]}
                    icon={
                      new Icon({
                        iconUrl: markerIcon,
                        iconSize: [20, 33], // Slightly smaller
                        iconAnchor: [10, 33],
                        popupAnchor: [1, -34],
                        className: "text-red-500",
                      })
                    }
                  >
                    <Popup>
                      <div className="p-1 text-red-500 font-medium">
                        Warning: {segment.floodRisk} flood risk area
                        <br />
                        Road Type: {segment.roadType}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            ))}

            {/* Safety issue markers */}
            {selectedRoute.safetyIssues.map(
              (issue, index) =>
                issue.location && (
                  <Marker
                    key={`issue-${index}`}
                    position={[issue.location.lat, issue.location.lon]}
                    icon={
                      new Icon({
                        iconUrl: markerIcon,
                        iconSize: [20, 33],
                        iconAnchor: [10, 33],
                        popupAnchor: [1, -34],
                        className:
                          issue.severity === "danger"
                            ? "text-red-600"
                            : issue.severity === "warning"
                            ? "text-amber-500"
                            : "text-blue-500",
                      })
                    }
                  >
                    <Popup>
                      <div className="p-1">
                        <strong
                          className={
                            issue.severity === "danger"
                              ? "text-red-600"
                              : issue.severity === "warning"
                              ? "text-amber-500"
                              : "text-blue-500"
                          }
                        >
                          {issue.type}
                        </strong>
                        <br />
                        {issue.description}
                      </div>
                    </Popup>
                  </Marker>
                )
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
