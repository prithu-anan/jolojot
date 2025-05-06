// This is a placeholder file for actual route planning functionality
// In a real application, you would connect to mapping services like Google Maps, Mapbox, etc.

// Import the OpenAI client
// Note: You'll need to install with: npm install openai
import OpenAI from 'openai';

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

// Define interfaces for AI response
interface AIRouteHazard {
  type: string;
  description: string;
  severity: 'info' | 'warning' | 'danger';
  location: {
    lat: number;
    lon: number;
  };
}

interface AIRoute {
  name: string;
  distance: number;
  duration: number;
  safetyScore: number;
  hazards: AIRouteHazard[];
}

interface AIRouteResponse {
  routes: AIRoute[];
}

// Check if OpenAI API key is available
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const isOpenAIConfigured = OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key';

// Initialize OpenAI only if API key is available
let openai: OpenAI | null = null;

if (isOpenAIConfigured) {
  try {
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: For production, proxy through your backend
    });
    console.log('OpenAI client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    openai = null;
  }
} else {
  console.log('OpenAI API key not configured, falling back to mock data');
}

// Get AI-generated route data
async function getAIGeneratedRouteData(start: RoutePoint, end: RoutePoint): Promise<AIRouteResponse | null> {
  // Skip if OpenAI is not configured
  if (!openai || !isOpenAIConfigured) {
    console.log('OpenAI not available, skipping AI route generation');
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a Bangladesh transportation and weather expert. Provide realistic route hazard information."
        },
        {
          role: "user",
          content: `Generate 3 possible routes from ${start.name || `${start.lat},${start.lon}`} to ${end.name || `${end.lat},${end.lon}`} in Bangladesh, with realistic hazard information, road conditions, and safety details. 
          
          Return a JSON object with this structure:
          {
            "routes": [
              {
                "name": "Route name (e.g., Safest Route, Fastest Route, etc.)",
                "distance": number (in meters),
                "duration": number (in seconds),
                "safetyScore": number (0-100),
                "hazards": [
                  {
                    "type": "flooding|roadwork|landslide|etc",
                    "description": "Detailed description of the hazard",
                    "severity": "info|warning|danger",
                    "location": {"lat": number, "lon": number}
                  }
                ]
              }
            ]
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content) as AIRouteResponse;
  } catch (error) {
    console.error("Error getting AI route data:", error);
    return null;
  }
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

  // Only try AI route generation if OpenAI is configured
  if (isOpenAIConfigured) {
    try {
      // Try to get AI-generated route data first
      const aiRouteData = await getAIGeneratedRouteData(startPoint, endPoint);

      if (aiRouteData && aiRouteData.routes && aiRouteData.routes.length > 0) {
        console.log("Using AI-generated route data");

        // Transform AI data to match the Route interface
        return aiRouteData.routes.map((route: AIRoute, index: number) => ({
          id: `route-${index + 1}`,
          name: route.name,
          startLocation: startPoint,
          endLocation: endPoint,
          segments: generateMockSegments(
            startPoint,
            endPoint,
            index === 0 ? 'safe' : index === 1 ? 'medium' : 'dangerous',
            route.distance
          ),
          totalDistance: route.distance,
          totalDuration: route.duration,
          safetyScore: route.safetyScore,
          safetyIssues: route.hazards.map((h: AIRouteHazard) => ({
            type: h.type,
            description: h.description,
            severity: h.severity,
            location: h.location
          }))
        }));
      }
    } catch (error) {
      console.error("Error with AI route generation, falling back to mock data:", error);
      // Continue with fallback mock data
    }
  }

  console.log("Falling back to mock route data");

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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    // Major Bangladesh cities
    'dhaka': { lat: 23.8103, lon: 90.4125, name: "Dhaka" },
    'khulna': { lat: 22.8456, lon: 89.5403, name: "Khulna" },
    'chittagong': { lat: 22.3569, lon: 91.7832, name: "Chittagong" },
    'rajshahi': { lat: 24.3745, lon: 88.6042, name: "Rajshahi" },
    'sylhet': { lat: 24.8949, lon: 91.8687, name: "Sylhet" },
    'barisal': { lat: 22.7010, lon: 90.3535, name: "Barisal" },
    'rangpur': { lat: 25.7439, lon: 89.2752, name: "Rangpur" },
    'comilla': { lat: 23.4682, lon: 91.1792, name: "Comilla" },
    'mymensingh': { lat: 24.7471, lon: 90.4203, name: "Mymensingh" },

    // Dhaka neighborhoods and areas
    'mohakhali': { lat: 23.7786, lon: 90.4106, name: "Mohakhali" },
    'polashi': { lat: 23.7273, lon: 90.3896, name: "Polashi" },
    'mirpur': { lat: 23.8223, lon: 90.3654, name: "Mirpur" },
    'uttara': { lat: 23.8758, lon: 90.3795, name: "Uttara" },
    'gulshan': { lat: 23.7949, lon: 90.4126, name: "Gulshan" },
    'banani': { lat: 23.7937, lon: 90.4066, name: "Banani" },
    'dhanmondi': { lat: 23.7461, lon: 90.3742, name: "Dhanmondi" },
    'motijheel': { lat: 23.7331, lon: 90.4176, name: "Motijheel" },
    'tejgaon': { lat: 23.7598, lon: 90.3958, name: "Tejgaon" },
    'bashundhara': { lat: 23.8208, lon: 90.4367, name: "Bashundhara" },
    'farmgate': { lat: 23.7573, lon: 90.3869, name: "Farmgate" },
    'shahbag': { lat: 23.7399, lon: 90.3958, name: "Shahbag" },
    'kamalapur': { lat: 23.7327, lon: 90.4264, name: "Kamalapur" },
    'badda': { lat: 23.7812, lon: 90.4266, name: "Badda" },
    'rampura': { lat: 23.7644, lon: 90.4193, name: "Rampura" },
    'puran dhaka': { lat: 23.7104, lon: 90.3967, name: "Puran Dhaka" },
    'old dhaka': { lat: 23.7104, lon: 90.3967, name: "Old Dhaka" },
    'new market': { lat: 23.7329, lon: 90.3843, name: "New Market" },
    'elephant road': { lat: 23.7420, lon: 90.3856, name: "Elephant Road" },
    'lalbagh': { lat: 23.7185, lon: 90.3884, name: "Lalbagh" },
    'jatrabari': { lat: 23.7105, lon: 90.4359, name: "Jatrabari" },
    'malibagh': { lat: 23.7531, lon: 90.4159, name: "Malibagh" },
    'moghbazar': { lat: 23.7500, lon: 90.4077, name: "Moghbazar" },
    'nikunja': { lat: 23.8352, lon: 90.4223, name: "Nikunja" },
    'khilgaon': { lat: 23.7464, lon: 90.4459, name: "Khilgaon" },
    'paltan': { lat: 23.7337, lon: 90.4125, name: "Paltan" },
    'wari': { lat: 23.7167, lon: 90.4174, name: "Wari" },

    // Important landmarks
    'dhaka university': { lat: 23.7341, lon: 90.3965, name: "Dhaka University" },
    'buet': { lat: 23.7275, lon: 90.3905, name: "BUET" },
    'tsc': { lat: 23.7328, lon: 90.3954, name: "TSC" },
    'shaheed minar': { lat: 23.7270, lon: 90.3990, name: "Shaheed Minar" },
    'suhrawardy udyan': { lat: 23.7315, lon: 90.3982, name: "Suhrawardy Udyan" },
    'parliament': { lat: 23.7631, lon: 90.3780, name: "Parliament" },
    'national museum': { lat: 23.7268, lon: 90.3991, name: "National Museum" },
    'zia intl airport': { lat: 23.8513, lon: 90.4086, name: "Shahjalal International Airport" },
    'hazrat shahjalal airport': { lat: 23.8513, lon: 90.4086, name: "Shahjalal International Airport" },
    'airport': { lat: 23.8513, lon: 90.4086, name: "Shahjalal International Airport" },
    'lalbagh fort': { lat: 23.7187, lon: 90.3883, name: "Lalbagh Fort" },
    'ahsan manzil': { lat: 23.7085, lon: 90.4046, name: "Ahsan Manzil" },
    'curzon hall': { lat: 23.7296, lon: 90.3995, name: "Curzon Hall" },
    'bahadur shah park': { lat: 23.7097, lon: 90.3991, name: "Bahadur Shah Park" },
    'shishu park': { lat: 23.7370, lon: 90.4050, name: "Shishu Park" },
    'dhaka zoo': { lat: 23.8006, lon: 90.3485, name: "Dhaka Zoo" },
    'botanical garden': { lat: 23.8021, lon: 90.3446, name: "Botanical Garden" },
    'ramna park': { lat: 23.7372, lon: 90.4006, name: "Ramna Park" },
    'hatirjheel': { lat: 23.7726, lon: 90.4153, name: "Hatirjheel" },
    'star mosque': { lat: 23.7112, lon: 90.4080, name: "Star Mosque" },
    'dhakeshwari temple': { lat: 23.7239, lon: 90.3850, name: "Dhakeshwari Temple" },
    'bailey road': { lat: 23.7436, lon: 90.3988, name: "Bailey Road" },
    'science lab': { lat: 23.7393, lon: 90.3832, name: "Science Lab" },
    'press club': { lat: 23.7293, lon: 90.4061, name: "Press Club" },
    'secretariat': { lat: 23.7317, lon: 90.4083, name: "Secretariat" },
    'high court': { lat: 23.7304, lon: 90.4062, name: "High Court" },
    'bangladesh bank': { lat: 23.7315, lon: 90.4134, name: "Bangladesh Bank" }
  };

  // Normalize input by converting to lowercase
  const normalizedName = locationName.trim().toLowerCase();

  // Check if it's a known location
  if (knownLocations[normalizedName]) {
    return knownLocations[normalizedName];
  }

  // Try to find partial matches
  const partialMatches = Object.keys(knownLocations).filter(loc =>
    loc.includes(normalizedName) || normalizedName.includes(loc)
  );

  if (partialMatches.length > 0) {
    // Use the first partial match
    return knownLocations[partialMatches[0]];
  }

  // If no match found, try using OpenStreetMap Nominatim API (if we were in a production app)
  // For now, we'll continue to use our hash-based approach with a better base location

  const hash = locationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Base coordinates (central Dhaka as default since most searches will be Dhaka-related)
  const baseLat = 23.7606;
  const baseLon = 90.3893;

  // Add some variation based on the string hash
  return {
    lat: baseLat + (hash % 10 - 5) * 0.01, // More controlled variance (-0.05 to 0.05 degrees)
    lon: baseLon + (hash % 14 - 7) * 0.01, // More controlled variance (-0.07 to 0.07 degrees)
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
