
// This is a placeholder file for actual weather API integration
// In a real application, you would connect to a weather data provider API

export interface WeatherData {
  location: string;
  currentCondition: string;
  temperature: number;
  rainfall: RainfallData;
  alerts: WeatherAlert[];
}

export interface RainfallData {
  intensity: 'none' | 'light' | 'medium' | 'heavy' | 'extreme';
  rate: number; // in mm/h
  forecast: {
    time: string;
    intensity: 'none' | 'light' | 'medium' | 'heavy' | 'extreme';
    rate: number;
  }[];
}

export interface WeatherAlert {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  issued: string;
  expires: string;
}

// Mock function to simulate fetching weather data
export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data
  return {
    location: "New York, NY",
    currentCondition: "Heavy Rain",
    temperature: 68,
    rainfall: {
      intensity: "heavy",
      rate: 15.2,
      forecast: [
        { time: "1h", intensity: "heavy", rate: 18.5 },
        { time: "2h", intensity: "medium", rate: 8.2 },
        { time: "3h", intensity: "light", rate: 3.1 },
      ]
    },
    alerts: [
      {
        type: "Flash Flood",
        severity: "danger",
        title: "Flash Flood Warning",
        description: "Flash flooding is occurring or imminent in the warned area. Move to higher ground immediately.",
        issued: "2025-04-29T14:30:00Z",
        expires: "2025-04-29T20:30:00Z"
      }
    ]
  };
};

// Get user's current location
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
};

// Convert location name to coordinates
export const geocodeLocation = async (locationName: string): Promise<{ lat: number; lon: number }> => {
  // This would connect to a geocoding API in a real application
  // For now, return mock data
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock coordinates (New York City)
  return { lat: 40.7128, lon: -74.006 };
};
