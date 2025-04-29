
import React, { useEffect, useRef, useState } from 'react';
import { CloudRain, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const mockRainIntensityData = [
  { id: 1, level: 'light', description: 'Light Rain', color: 'bg-rain-light' },
  { id: 2, level: 'medium', description: 'Moderate Rain', color: 'bg-rain-medium' },
  { id: 3, level: 'heavy', description: 'Heavy Rain', color: 'bg-rain-heavy' },
  { id: 4, level: 'extreme', description: 'Extreme Rain', color: 'bg-rain-extreme' }
];

const WeatherMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulating map loading and location fetch
    const timer = setTimeout(() => {
      setLocation('New York, NY');
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

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
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                My Location
              </Button>
              <Button variant="outline" size="sm">
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
                {/* Placeholder for the actual map */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-lg text-muted-foreground">
                    Weather Map will be displayed here
                  </p>
                </div>
                
                {/* Simulated radar overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-rain-light/20 via-rain-medium/30 to-rain-heavy/40">
                  {/* Simulated heavy rain cells */}
                  <div className="absolute top-1/4 left-1/3 w-32 h-24 rounded-full bg-rain-heavy/60 blur-xl"></div>
                  <div className="absolute bottom-1/3 right-1/4 w-20 h-20 rounded-full bg-rain-extreme/70 blur-lg"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Rain intensity legend */}
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
