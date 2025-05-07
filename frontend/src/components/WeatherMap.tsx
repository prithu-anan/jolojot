import React, { useEffect, useRef, useState } from 'react';
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

const WeatherMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("Dhaka");
  const [location, setLocation] = useState<string>('');
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchWeather = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${q}&days=1&alerts=yes&aqi=no`
      );
      const data = await res.json();
      setLocation(`${data.location.name}, ${data.location.country}`);
      setWeather({
        temp: data.current.temp_c,
        condition: data.current.condition.text
      });
    } catch (err) {
      setLocation("Not Found");
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(query);
  }, []);

  const handleSearch = () => {
    fetchWeather(query);
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
                {isLoading ? 'Loading weather data...' : `Current Location: ${location}`}
              </CardDescription>
              {weather && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {weather.temp}°C, {weather.condition}
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
          <div className={cn(
            "map-container relative flex items-center justify-center",
            isLoading ? "bg-muted animate-pulse" : "bg-[#EBF8FF]"
          )}>
            {isLoading ? (
              <div className="text-center">
                <CloudRain className="h-10 w-10 text-muted-foreground mx-auto mb-2 animate-pulse" />
                <p className="text-muted-foreground">Loading weather map...</p>
              </div>
            ) : (
              <div 
                ref={mapRef} 
                className="w-full h-full relative overflow-hidden" 
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-lg text-muted-foreground">
                    Weather Map will be displayed here
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-rain-light/20 via-rain-medium/30 to-rain-heavy/40">
                  <div className="absolute top-1/4 left-1/3 w-32 h-24 rounded-full bg-rain-heavy/60 blur-xl"></div>
                  <div className="absolute bottom-1/3 right-1/4 w-20 h-20 rounded-full bg-rain-extreme/70 blur-lg"></div>
                </div>
              </div>
            )}
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
