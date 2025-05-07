import React, { useState } from 'react';
import { ArrowRight, MapPin, Search, AlertTriangle, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  findSafeRoutes,
  Route,
  formatDistance,
  formatDuration,
  getSafetyLevel
} from '@/utils/routeUtils';

interface RoutePlannerProps {
  onRouteSelect?: (routeId: string, allRoutes: Route[]) => void;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ onRouteSelect }) => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLocation || !endLocation) return;

    setIsSearching(true);
    setError(null);

    try {
      const routeOptions = await findSafeRoutes(startLocation, endLocation);
      setRoutes(routeOptions);
      const safest = routeOptions[0] ?? null;
      setSelectedRoute(safest);

      if (onRouteSelect && safest) {
        onRouteSelect(safest.id, routeOptions);
      }
    } catch (err) {
      console.error("Error finding routes:", err);
      setError("Unable to find routes. Please try different locations.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    if (onRouteSelect) {
      onRouteSelect(route.id, routes);
    }
  };

  const getSafetyColor = (safetyLevel: 'safe' | 'warning' | 'danger') => {
    switch (safetyLevel) {
      case 'safe': return 'bg-green-500 text-white';
      case 'warning': return 'bg-amber-500 text-white';
      case 'danger': return 'bg-red-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getSafetyText = (safetyLevel: 'safe' | 'warning' | 'danger') => {
    switch (safetyLevel) {
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
                className={cn("min-w-[100px]", isSearching && "opacity-80 cursor-not-allowed")}
              >
                {isSearching ? 'Searching...' : 'Search'}
                {!isSearching && <Search className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {routes.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Available Routes:</div>
              <div className="space-y-3">
                {routes.map((route) => {
                  const safetyLevel = getSafetyLevel(route.safetyScore);
                  return (
                    <div
                      key={route.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all",
                        selectedRoute?.id === route.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => handleSelectRoute(route)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">{route.name}</div>
                        <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                          <span className="text-sm">
                            {formatDuration(route.totalDuration)} • {formatDistance(route.totalDistance)}
                          </span>
                          <div
                            className={cn(
                              "text-xs px-2 py-1 rounded-full whitespace-nowrap",
                              getSafetyColor(safetyLevel)
                            )}
                          >
                            {getSafetyText(safetyLevel)}
                          </div>
                        </div>
                      </div>

                      {route.safetyIssues.length > 0 && (
                        <div className="bg-muted p-2 rounded mt-2 text-sm">
                          <div className="font-medium mb-1 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Safety Issues:
                          </div>
                          <ul className="list-disc pl-5">
                            {route.safetyIssues.map((issue, idx) => (
                              <li
                                key={idx}
                                className={cn(
                                  "text-xs",
                                  issue.severity === 'danger' && "text-red-600",
                                  issue.severity === 'warning' && "text-amber-600"
                                )}
                              >
                                {issue.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
