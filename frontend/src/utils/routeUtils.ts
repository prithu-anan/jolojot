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
  
  // Calculate approximate distance between points in kilometers using Haversine formula
  const distance = calculateDistance(startPoint, endPoint);
  console.log(`Calculated distance: ${distance} km`);
  
  // Dhaka to Khulna specific route data (approximately 270km by road)
  const isDhakaToKhulna = 
    (startPoint.name?.toLowerCase() === 'dhaka' && endPoint.name?.toLowerCase() === 'khulna') ||
    (startPoint.name?.toLowerCase() === 'khulna' && endPoint.name?.toLowerCase() === 'dhaka');

  // Scale factors for the dummy routes
  const totalDistance = isDhakaToKhulna ? 270000 : Math.round(distance * 1000); // convert km to meters
  const baseTime = Math.round(totalDistance / 50 * 3.6); // assuming 50 km/h average speed
  
  // Generate mock routes with more realistic data
  return [
    {
      id: "route-1",
      name: "Safest Route",
      startLocation: startPoint,
      endLocation: endPoint,
      segments: generateMockSegments(startPoint, endPoint, 'safe', totalDistance),
      totalDistance: Math.round(totalDistance * 1.15), // slightly longer but safer
      totalDuration: Math.round(baseTime * 1.3), // takes longer due to safety precautions
      safetyScore: 92,
      safetyIssues: []
    },
    {
      id: "route-2",
      name: "Balanced Route",
      startLocation: startPoint,
      endLocation: endPoint,
      segments: generateMockSegments(startPoint, endPoint, 'medium', totalDistance),
      totalDistance: totalDistance,
      totalDuration: baseTime,
      safetyScore: 75,
      safetyIssues: [
        {
          type: "flooding",
          description: isDhakaToKhulna 
            ? "Moderate flooding reported near Faridpur" 
            : "Moderate flooding reported on part of the route",
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
      segments: generateMockSegments(startPoint, endPoint, 'dangerous', totalDistance),
      totalDistance: Math.round(totalDistance * 0.9), // shortest distance
      totalDuration: Math.round(baseTime * 1.1), // takes longer due to poor conditions
      safetyScore: 45,
      safetyIssues: [
        {
          type: "flooding",
          description: isDhakaToKhulna 
            ? "Severe flooding reported on Jessore Highway" 
            : "Severe flooding reported on multiple road segments",
          severity: "danger",
          location: {
            lat: startPoint.lat + (endPoint.lat - startPoint.lat) * 0.3,
            lon: startPoint.lon + (endPoint.lon - startPoint.lon) * 0.3
          }
        },
        {
          type: "closure",
          description: isDhakaToKhulna 
            ? "Road closure near Magura due to water levels" 
            : "Road closure due to flooding",
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

// Haversine formula to calculate distance between two points in kilometers
function calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lon - point1.lon);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Mock function to generate segments
const generateMockSegments = (
  start: RoutePoint, 
  end: RoutePoint, 
  riskLevel: 'safe' | 'medium' | 'dangerous',
  totalDistance: number
): RouteSegment[] => {
  // In a real app, this would generate proper segments based on mapping data
  const segments: RouteSegment[] = [];
  
  // Create more intermediate points for longer routes
  const numSegments = totalDistance > 100000 ? 5 : 3;
  const segmentDistance = totalDistance / numSegments;
  
  let currentPoint = start;
  
  for (let i = 1; i <= numSegments; i++) {
    const ratio = i / numSegments;
    const nextPoint: RoutePoint = i === numSegments 
      ? end 
      : {
          lat: start.lat + (end.lat - start.lat) * ratio,
          lon: start.lon + (end.lon - start.lon) * ratio
        };
    
    // Vary the risk based on the segment and risk level
    let floodRisk: 'none' | 'low' | 'medium' | 'high' | 'extreme';
    
    if (riskLevel === 'safe') {
      floodRisk = i % 3 === 0 ? 'low' : 'none';
    } else if (riskLevel === 'medium') {
      floodRisk = i % 2 === 0 ? 'medium' : 'low';
    } else {
      // Dangerous route has progressively worse conditions
      if (i <= numSegments / 3) floodRisk = 'medium';
      else if (i <= (2 * numSegments) / 3) floodRisk = 'high';
      else floodRisk = 'extreme';
    }
    
    // Road types alternate between major roads and highways
    const roadType: 'highway' | 'major' | 'local' | 'bridge' | 'tunnel' = 
      i % 3 === 0 ? 'highway' : i % 2 === 0 ? 'major' : 'local';
      
    // Add the segment
    segments.push({
      startPoint: currentPoint,
      endPoint: nextPoint,
      distance: Math.round(segmentDistance),
      duration: Math.round(segmentDistance / 50 * 3.6), // 50 km/h average speed
      floodRisk,
      roadType
    });
    
    currentPoint = nextPoint;
  }
  
  return segments;
};

// Mock geocoding function
export const geocodeLocation = async (locationName: string): Promise<RoutePoint> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Common locations in Bangladesh
  const knownLocations: Record<string, RoutePoint> = {
    // Bangladesh city coordinates
    'dhaka': { lat: 23.8103, lon: 90.4125, name: "Dhaka" },
    'khulna': { lat: 22.8456, lon: 89.5403, name: "Khulna" },
    'chittagong': { lat: 22.3569, lon: 91.7832, name: "Chittagong" },
    'rajshahi': { lat: 24.3745, lon: 88.6042, name: "Rajshahi" },
    'sylhet': { lat: 24.8949, lon: 91.8687, name: "Sylhet" },
    'barisal': { lat: 22.7010, lon: 90.3535, name: "Barisal" },
    'rangpur': { lat: 25.7439, lon: 89.2752, name: "Rangpur" },
    'comilla': { lat: 23.4682, lon: 91.1792, name: "Comilla" },
    'mymensingh': { lat: 24.7471, lon: 90.4203, name: "Mymensingh" }
  };
  
  // Normalize input by converting to lowercase
  const normalizedName = locationName.trim().toLowerCase();
  
  // Check if it's a known location
  if (knownLocations[normalizedName]) {
    return knownLocations[normalizedName];
  }
  
  // If not a known location, generate one based on hash
  const hash = locationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base coordinates (roughly central Bangladesh)
  const baseLat = 23.685;
  const baseLon = 90.356;
  
  // Add some variation based on the string hash
  return {
    lat: baseLat + (hash % 10) * 0.02, 
    lon: baseLon + (hash % 7) * 0.02,
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
