import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RouteMap from '@/components/RouteMap';
import RoutePlanner from '@/components/RoutePlanner';
import { getCurrentLocation } from '@/utils/weatherApi';

const RoutePlanningPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const position = await getCurrentLocation();
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      } catch (error) {
        console.error('Error fetching user location:', error);
        alert('Unable to fetch location. Please enable location permissions in your browser.');
      }
    };

    fetchUserLocation();
  }, []);

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b border-border">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Route Planner</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RoutePlanner onRouteSelect={handleRouteSelect} />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden h-[600px]">
              <RouteMap selectedRouteId={selectedRouteId} userLocation={userLocation} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoutePlanningPage;
