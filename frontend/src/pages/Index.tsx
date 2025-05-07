import React, { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import WeatherMap from '@/components/WeatherMap';
import RoutePlanner from '@/components/RoutePlanner';
import SafetyAlert from '@/components/SafetyAlert';
import Footer from '@/components/Footer';
import { fetchWeatherData, WeatherData, WeatherAlert } from '@/utils/weatherApi';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { CloudRain } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [currentAlert, setCurrentAlert] = useState<WeatherAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        // Mock coordinates for NYC
        const data = await fetchWeatherData(40.7128, -74.006);
        setWeatherData(data);
        
        // Set the most severe alert as current
        if (data.alerts && data.alerts.length > 0) {
          const sortedAlerts = [...data.alerts].sort((a, b) => {
            const severityRank = { info: 0, warning: 1, danger: 2 };
            return severityRank[b.severity] - severityRank[a.severity];
          });
          setCurrentAlert(sortedAlerts[0]);
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeatherData();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error signing out");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background border-b border-border">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CloudRain className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">জলজট</h1>
        </div>
        <nav className="flex gap-4 items-center">
  <Link to="/forum" className="font-bold hover:text-primary transition-colors">
    Forum
  </Link>
  <Link to="/authority" className="font-bold hover:text-primary transition-colors">
    Dashboard
  </Link>
  {!loading && (
    <>
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline-block">
            {user.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      )}
    </>
  )}
</nav>


        </div>
      </header>

      <main className="flex-1">
        {currentAlert && (
          <div className="container mx-auto py-6 px-4">
            <SafetyAlert 
              level={currentAlert.severity} 
              message={currentAlert.description}
            />
          </div>
        )}
        
        <section className="py-12 bg-background">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-4xl font-bold mb-6">Safe Navigation Through Extreme Rain</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get real-time weather information and find the safest routes to avoid flooded areas during severe weather.
            </p>
            
            <div className="my-10">
              <WeatherMap />
            </div>
          </div>
        </section>

        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-6">Plan Your Safe Route</h2>
              <div className="flex flex-col items-center space-y-4">
                <p className="text-center text-lg text-muted-foreground mb-4">
                  Use our route planning tool to find safe paths during extreme weather conditions.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/routes')}
                  className="px-8"
                >
                  Open Route Planner
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-center">Share & Discover Location Conditions</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-center">
              Connect with others to share real-time information about weather conditions,
              road status, and safety alerts in different locations.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/forum')}
                className="px-8"
              >
                Browse Forum
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/forum/create')}
                className="px-8"
              >
                Share Condition
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-center">Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Location Conditions</h3>
                <p>
                  Get real-time updates about weather conditions, road status,
                  and safety alerts from community members.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Community Voting</h3>
                <p>
                  Vote on posts to highlight the most accurate and helpful information
                  about different locations.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Visual Evidence</h3>
                <p>
                  Share and view images of current conditions to get a clear picture
                  of what to expect at your destination.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 Rain Route Refuge | Community-powered location conditions
          </p>
        </div>
      </footer>
    </div>
  );
}
