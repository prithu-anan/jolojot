
import React, { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import WeatherMap from '@/components/WeatherMap';
import RoutePlanner from '@/components/RoutePlanner';
import SafetyAlert from '@/components/SafetyAlert';
import Footer from '@/components/Footer';
import { fetchWeatherData, WeatherData, WeatherAlert } from '@/utils/weatherApi';

const Index = () => {
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

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-1 container py-8">
        {currentAlert && (
          <div className="mb-8">
            <SafetyAlert 
              level={currentAlert.severity} 
              message={currentAlert.description}
            />
          </div>
        )}
        
        <div className="space-y-12">
          <section>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Safe Navigation Through Extreme Rain</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get real-time weather information and find the safest routes to avoid flooded areas during severe weather.
              </p>
            </div>
            
            <div className="my-10">
              <WeatherMap />
            </div>
          </section>
          
          <section>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-6">Plan Your Safe Route</h2>
              <RoutePlanner />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
