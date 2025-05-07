import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CloudRain, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const API_KEY = "0520a2afd47a4d4c99752444250705";

const mockRainIntensityData = [
  { id: 1, level: 'light', description: 'Light Rain', color: 'bg-rain-light' },
  { id: 2, level: 'medium', description: 'Moderate Rain', color: 'bg-rain-medium' },
  { id: 3, level: 'heavy', description: 'Heavy Rain', color: 'bg-rain-heavy' },
  { id: 4, level: 'extreme', description: 'Extreme Rain', color: 'bg-rain-extreme' }
];

// Fix Leaflet icon issue
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

type WeatherPoint = {
  lat: number;
  lon: number;
  temp: number;
  icon: string;
  location: string;
  condition: string;
};

const WeatherMap: React.FC = () => {
  const [query, setQuery] = useState("Dhaka");
  const [center, setCenter] = useState<[number, number]>([23.8103, 90.4125]);
  const [weatherPoints, setWeatherPoints] = useState<WeatherPoint[]>([]);
  const [selectedWeather, setSelectedWeather] = useState<WeatherPoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchWeather = async (lat: number, lon: number): Promise<WeatherPoint | null> => {
    try {
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${lat},${lon}`);
      const data = await res.json();
      return {
        lat,
        lon,
        temp: data.current.temp_c,
        icon: data.current.condition.icon,
        location: data.location.name,
        condition: data.current.condition.text
      };
    } catch {
      return null;
    }
  };

  const fetchNearbyWeather = async (q: string) => {
    setIsLoading(true);
    setWeatherPoints([]);
    try {
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${q}`);
      const data = await res.json();
      const lat = data.location.lat;
      const lon = data.location.lon;
      setCenter([lat, lon]);

      const deltas = [-0.5, 0, 0.5];
      const promises = deltas.flatMap(dx =>
        deltas.map(dy => fetchWeather(lat + dx, lon + dy))
      );

      const results = await Promise.all(promises);
      const validPoints = results.filter(Boolean) as WeatherPoint[];
      setWeatherPoints(validPoints);
      setSelectedWeather(validPoints.find(p => p.lat === lat && p.lon === lon) || null);
    } catch (err) {
      console.error("Failed to load weather data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyWeather(query);
  }, []);

  const handleSearch = () => {
    fetchNearbyWeather(query);
  };

  return (
    <div className="w-full">
      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <CloudRain className="h-6 w-6 text-primary" />
                Weather Radar
              </CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Loading weather data...'
                  : `Current Location: ${selectedWeather?.location || "N/A"}`}
              </CardDescription>
              {selectedWeather && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedWeather.temp}°C, {selectedWeather.condition}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter location..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                Search Area
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          <div className="px-4">
            <div className="h-[500px] w-full">
              <MapContainer center={center} zoom={8} className="h-full w-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {weatherPoints.map((point, idx) => (
                  <Marker
                    key={idx}
                    position={[point.lat, point.lon]}
                    eventHandlers={{
                      click: () => setSelectedWeather(point),
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong>{point.location}</strong>
                        <img src={point.icon} alt="weather" className="w-10 h-10 mx-auto" />
                        <p>{point.temp}°C</p>
                        <p>{point.condition}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="p-4 bg-background">
            <p className="text-sm font-medium mb-2">Rain Intensity</p>
            <div className="flex space-x-3">
              {mockRainIntensityData.map((item) => (
                <div key={item.id} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-1`}></div>
                  <span className="text-xs">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Button className="bg-primary hover:bg-primary/90">
          Plan Safe Route <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WeatherMap;
