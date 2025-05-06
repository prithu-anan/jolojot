import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  MapPin,
  Search,
  AlertTriangle,
  Navigation,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  findSafeRoutes,
  Route,
  formatDistance,
  formatDuration,
  getSafetyLevel,
} from "@/utils/routeUtils";

interface RoutePlannerProps {
  onRouteSelect?: (routeId: string) => void;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ onRouteSelect }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Check if AI route generation is active
  const isAIEnabled =
    import.meta.env.VITE_OPENAI_API_KEY &&
    import.meta.env.VITE_OPENAI_API_KEY !== "your_openai_api_key";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLocation || !endLocation) return;
    await findRoutes();
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);

    // Notify parent component about route selection if callback exists
    if (onRouteSelect) {
      onRouteSelect(route.id);
    }
  };

  const getSafetyColor = (safetyLevel: "safe" | "warning" | "danger") => {
    switch (safetyLevel) {
      case "safe":
        return "bg-green-500 text-white";
      case "warning":
        return "bg-amber-500 text-white";
      case "danger":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getSafetyText = (safetyLevel: "safe" | "warning" | "danger") => {
    switch (safetyLevel) {
      case "safe":
        return "Safe route";
      case "warning":
        return "Use caution";
      case "danger":
        return "Not recommended";
      default:
        return "Unknown";
    }
  };

  const findRoutes = async () => {
    if (!startLocation || !endLocation) {
      alert("Please enter both start and end locations");
      return;
    }

    setIsSearching(true);
    setError(null);
    setLoading(true);

    try {
      const routeOptions = await findSafeRoutes(startLocation, endLocation);
      setRoutes(routeOptions);

      // Dispatch a custom event with the routes data for the RouteMap component
      const routeUpdateEvent = new CustomEvent("route-update", {
        detail: { routes: routeOptions },
      });
      window.dispatchEvent(routeUpdateEvent);

      // Auto-select first route
      if (routeOptions.length > 0) {
        setSelectedRouteId(routeOptions[0].id);
        setSelectedRoute(routeOptions[0]);
        if (onRouteSelect) {
          onRouteSelect(routeOptions[0].id);
        }
      }
    } catch (error) {
      console.error("Error finding routes:", error);
      setError("Unable to find routes. Please try different locations.");
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    if (onRouteSelect) {
      onRouteSelect(routeId);
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Route Planner
            </CardTitle>
            {isAIEnabled ? (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                AI Powered
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
              >
                Mock Data
              </Badge>
            )}
          </div>
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
                {isSearching ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
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
              <div className="text-sm font-medium text-muted-foreground">
                Available Routes:
              </div>
              <div className="space-y-3">
                {routes.map((route) => {
                  const safetyLevel = getSafetyLevel(route.safetyScore);
                  return (
                    <div
                      key={route.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all",
                        selectedRouteId === route.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => handleRouteSelect(route.id)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">{route.name}</div>
                        <div className="flex items-center">
                          <span className="text-sm mr-3">
                            {formatDuration(route.totalDuration)} •{" "}
                            {formatDistance(route.totalDistance)}
                          </span>
                          <Badge
                            variant={
                              safetyLevel === "safe"
                                ? "outline"
                                : safetyLevel === "warning"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {route.safetyScore}/100
                          </Badge>
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
                                  issue.severity === "danger" && "text-red-600",
                                  issue.severity === "warning" &&
                                    "text-amber-600"
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

              {/* If not on the map view, show the simple route visualization */}
              {!onRouteSelect && selectedRoute && (
                <div className="mt-6">
                  <div className="p-4 border rounded-lg bg-muted mb-4">
                    <h3 className="font-medium text-lg mb-2">Route Map</h3>
                    <div className="bg-background rounded-lg p-4 h-64 flex items-center justify-center relative overflow-hidden">
                      {/* Simple visual representation of the route */}
                      <div className="w-full h-full relative">
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary z-10">
                          <div className="absolute -top-6 -left-2 bg-background p-1 rounded shadow-sm text-xs">
                            Start
                          </div>
                        </div>
                        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 rounded-full bg-primary z-10">
                          <div className="absolute -top-6 -left-2 bg-background p-1 rounded shadow-sm text-xs">
                            End
                          </div>
                        </div>

                        {/* Route path - dynamically style based on safety */}
                        <svg className="absolute inset-0 w-full h-full">
                          <path
                            d={`M ${window.innerWidth / 4} ${
                              window.innerHeight / 4
                            } 
                                C ${window.innerWidth / 2} ${
                              window.innerHeight / 3
                            }, 
                                  ${window.innerWidth / 2} ${
                              window.innerHeight / 1.5
                            }, 
                                  ${window.innerWidth / 1.33} ${
                              window.innerHeight / 1.33
                            }`}
                            fill="none"
                            strokeWidth="3"
                            stroke={
                              selectedRoute.safetyScore > 80
                                ? "#22c55e"
                                : selectedRoute.safetyScore > 50
                                ? "#f59e0b"
                                : "#ef4444"
                            }
                            strokeDasharray={
                              selectedRoute.safetyScore < 50 ? "5,5" : "none"
                            }
                          />
                        </svg>

                        {/* Safety issues markers */}
                        {selectedRoute.safetyIssues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "absolute w-4 h-4 rounded-full flex items-center justify-center",
                              issue.severity === "danger"
                                ? "bg-red-500"
                                : issue.severity === "warning"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            )}
                            style={{
                              top: `${30 + idx * 15}%`,
                              left: `${35 + idx * 15}%`,
                            }}
                          >
                            <AlertTriangle className="h-2 w-2 text-white" />
                            <div className="absolute -top-6 -left-2 bg-background p-1 rounded shadow-sm text-xs whitespace-nowrap">
                              {issue.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full">
                    Navigate Now <Navigation className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {routes.length === 0 &&
            !isSearching &&
            (startLocation || endLocation) && (
              <div className="mt-6 text-center text-muted-foreground py-8">
                Enter both locations to find safe routes
              </div>
            )}

          {isSearching && (
            <div className="mt-6 text-center py-8">
              <div className="animate-pulse">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Searching for the safest routes...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutePlanner;
