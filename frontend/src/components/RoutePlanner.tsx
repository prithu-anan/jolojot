
import React, { useState } from 'react';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RouteOption {
  id: number;
  name: string;
  duration: string;
  distance: string;
  safety: 'safe' | 'warning' | 'danger';
  description: string;
}

const mockRouteOptions: RouteOption[] = [
  {
    id: 1,
    name: 'Recommended Route',
    duration: '25 min',
    distance: '3.2 miles',
    safety: 'safe',
    description: 'Avoids all flooded areas, uses elevated roads'
  },
  {
    id: 2,
    name: 'Fastest Route',
    duration: '18 min',
    distance: '2.8 miles',
    safety: 'warning',
    description: 'Passes through area with moderate rain intensity'
  },
  {
    id: 3,
    name: 'Shortest Route',
    duration: '22 min',
    distance: '2.5 miles',
    safety: 'danger',
    description: 'Has reported flooding on Lincoln Ave'
  }
];

const RoutePlanner: React.FC = () => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLocation || !endLocation) return;
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setRoutes(mockRouteOptions);
      setIsSearching(false);
    }, 1500);
  };

  const handleSelectRoute = (route: RouteOption) => {
    setSelectedRoute(route);
  };

  const getSafetyColor = (safety: string) => {
    switch(safety) {
      case 'safe': return 'bg-safety-safe';
      case 'warning': return 'bg-safety-warning';
      case 'danger': return 'bg-safety-danger';
      default: return 'bg-gray-400';
    }
  };

  const getSafetyText = (safety: string) => {
    switch(safety) {
      case 'safe': return 'Safe route';
      case 'warning': return 'Use caution';
      case 'danger': return 'Not recommended';
      default: return 'Unknown';
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Route Planner
          </CardTitle>
          <CardDescription>
            Find the safest route during extreme rain conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Starting location" 
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative flex-grow">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Destination" 
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSearching || !startLocation || !endLocation}
                className={cn(
                  "min-w-[100px]",
                  isSearching && "opacity-80 cursor-not-allowed"
                )}
              >
                {isSearching ? 'Searching...' : 'Search'}
                {!isSearching && <Search className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </form>

          {routes.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Available Routes:</div>
              <div className="space-y-3">
                {routes.map((route) => (
                  <div 
                    key={route.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      selectedRoute?.id === route.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    )}
                    onClick={() => handleSelectRoute(route)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{route.name}</div>
                      <div className="flex items-center">
                        <span className="text-sm mr-3">{route.duration} • {route.distance}</span>
                        <div className={cn(
                          "text-xs text-white px-2 py-1 rounded-full flex items-center",
                          getSafetyColor(route.safety)
                        )}>
                          {getSafetyText(route.safety)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{route.description}</p>
                  </div>
                ))}
              </div>

              {selectedRoute && (
                <div className="mt-6">
                  <Button className="w-full">
                    Navigate Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {routes.length === 0 && !isSearching && (startLocation || endLocation) && (
            <div className="mt-6 text-center text-muted-foreground py-8">
              Enter both locations to find safe routes
            </div>
          )}
          
          {isSearching && (
            <div className="mt-6 text-center py-8">
              <div className="animate-pulse">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Searching for the safest routes...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutePlanner;
