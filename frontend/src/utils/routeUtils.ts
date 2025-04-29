
// This is a placeholder file for actual route planning functionality
// In a real application, you would connect to mapping services like Google Maps, Mapbox, etc.

export interface RoutePoint {
  lat: number;
  lon: number;
  name?: string;
}

export interface RouteSegment {
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  distance: number; // in meters
  duration: number; // in seconds
  floodRisk: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  roadType: 'highway' | 'major' | 'local' | 'bridge' | 'tunnel';
}

export interface Route {
  id: string;
  name: string;
  startLocation: RoutePoint;
  endLocation: RoutePoint;
  segments: RouteSegment[];
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
  safetyScore: number; // 0-100, higher is safer
  safetyIssues: {
    type: string;
    description: string;
    severity: 'info' | 'warning' | 'danger';
    location?: RoutePoint;
  }[];
}

// Mock function to find safe routes
export const findSafeRoutes = async (
  start: string | RoutePoint,
  end: string | RoutePoint
): Promise<Route[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Convert string locations to coordinates if needed
  const startPoint: RoutePoint = typeof start === 'string' 
    ? { lat: 40.7128, lon: -74.006 } // Mock coordinates
    : start;
    
  const endPoint: RoutePoint = typeof end === 'string'
    ? { lat: 40.7641, lon: -73.9866 } // Mock coordinates
    : end;
  
  // Generate mock routes
  return [
    {
      id: "route-1",
      name: "Recommended Route",
      startLocation: startPoint,
      endLocation: endPoint,
      segments: [], // In a real app, this would contain detailed segments
      totalDistance: 5150, // 5.15 km
      totalDuration: 1500, // 25 minutes
      safetyScore: 95,
      safetyIssues: []
    },
    {
      id: "route-2",
      name: "Fastest Route",
      startLocation: startPoint,
      endLocation: endPoint,
      segments: [], // In a real app, this would contain detailed segments
      totalDistance: 4500, // 4.5 km
      totalDuration: 1080, // 18 minutes
      safetyScore: 75,
      safetyIssues: [
        {
          type: "flooding",
          description: "Moderate flooding reported on part of the route",
          severity: "warning"
        }
      ]
    },
    {
      id: "route-3",
      name: "Shortest Route",
      startLocation: startPoint,
      endLocation: endPoint,
      segments: [], // In a real app, this would contain detailed segments
      totalDistance: 4000, // 4 km
      totalDuration: 1320, // 22 minutes
      safetyScore: 45,
      safetyIssues: [
        {
          type: "flooding",
          description: "Severe flooding reported on Lincoln Ave",
          severity: "danger"
        }
      ]
    }
  ];
};

// Format distance for display
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1609.34).toFixed(1)} miles`;
};

// Format duration for display
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} h ${remainingMinutes} min`;
};

// Get safety level based on safety score
export const getSafetyLevel = (safetyScore: number): 'safe' | 'warning' | 'danger' => {
  if (safetyScore >= 80) return 'safe';
  if (safetyScore >= 50) return 'warning';
  return 'danger';
};
