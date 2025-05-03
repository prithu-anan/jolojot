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
    ? await geocodeLocation(start)
    : start;
    
  const endPoint: RoutePoint = typeof end === 'string'
    ? await geocodeLocation(end)
    : end;
  
  // Generate mock routes
  return [
    {
      id: "route-1",
      name: "Recommended Route",
      startLocation: startPoint,
      endLocation: endPoint,
      segments: generateMockSegments(startPoint, endPoint, 'safe'),
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
      segments: generateMockSegments(startPoint, endPoint, 'medium'),
      totalDistance: 4500, // 4.5 km
      totalDuration: 1080, // 18 minutes
      safetyScore: 75,
      safetyIssues: [
        {
          type: "flooding",
          description: "Moderate flooding reported on part of the route",
          severity: "warning",
          location: {
            lat: startPoint.lat + (endPoint.lat - startPoint.lat) * 0.4,
            lon: startPoint.lon + (endPoint.lon - startPoint.lon) * 0.4
          }
        }
      ]
    },
    {
      id: "route-3",
      name: "Shortest Route",
      startLocation: startPoint,
      endLocation: endPoint,
      segments: generateMockSegments(startPoint, endPoint, 'dangerous'),
      totalDistance: 4000, // 4 km
      totalDuration: 1320, // 22 minutes
      safetyScore: 45,
      safetyIssues: [
        {
          type: "flooding",
          description: "Severe flooding reported on Lincoln Ave",
          severity: "danger",
          location: {
            lat: startPoint.lat + (endPoint.lat - startPoint.lat) * 0.3,
            lon: startPoint.lon + (endPoint.lon - startPoint.lon) * 0.3
          }
        },
        {
          type: "closure",
          description: "Road closure at Broadway intersection",
          severity: "danger",
          location: {
            lat: startPoint.lat + (endPoint.lat - startPoint.lat) * 0.7,
            lon: startPoint.lon + (endPoint.lon - startPoint.lon) * 0.7
          }
        }
      ]
    }
  ];
};

// Mock function to generate segments
const generateMockSegments = (
  start: RoutePoint, 
  end: RoutePoint, 
  riskLevel: 'safe' | 'medium' | 'dangerous'
): RouteSegment[] => {
  // In a real app, this would generate proper segments based on mapping data
  const segments: RouteSegment[] = [];
  
  // Create sample segments
  const midpoint1: RoutePoint = {
    lat: start.lat + (end.lat - start.lat) * 0.33,
    lon: start.lon + (end.lon - start.lon) * 0.33
  };
  
  const midpoint2: RoutePoint = {
    lat: start.lat + (end.lat - start.lat) * 0.66,
    lon: start.lon + (end.lon - start.lon) * 0.66
  };
  
  segments.push({
    startPoint: start,
    endPoint: midpoint1,
    distance: 1500,
    duration: 360,
    floodRisk: riskLevel === 'safe' ? 'none' : riskLevel === 'medium' ? 'low' : 'medium',
    roadType: 'major'
  });
  
  segments.push({
    startPoint: midpoint1,
    endPoint: midpoint2,
    distance: 1800,
    duration: 480,
    floodRisk: riskLevel === 'safe' ? 'low' : riskLevel === 'medium' ? 'medium' : 'high',
    roadType: 'local'
  });
  
  segments.push({
    startPoint: midpoint2,
    endPoint: end,
    distance: 1700,
    duration: 420,
    floodRisk: riskLevel === 'safe' ? 'none' : riskLevel === 'medium' ? 'medium' : 'extreme',
    roadType: 'highway'
  });
  
  return segments;
};

// Mock geocoding function
export const geocodeLocation = async (locationName: string): Promise<RoutePoint> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Generate some variation in coordinates based on the input string
  const hash = locationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base coordinates (NYC area)
  const baseLat = 40.7128;
  const baseLon = -74.006;
  
  // Add some variation based on the string hash
  return {
    lat: baseLat + (hash % 10) * 0.01,
    lon: baseLon + (hash % 7) * 0.01,
    name: locationName
  };
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
