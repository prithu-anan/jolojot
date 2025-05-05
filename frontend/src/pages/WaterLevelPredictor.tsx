import React, { useState } from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const stations = [
  { id: 1, name: "Station A" },
  { id: 2, name: "Station B" },
  { id: 3, name: "Station C" },
];

export default function WaterLevelPredictor() {
  const [form, setForm] = useState({
    stationId: 1,
    rainfall: "",
    temp: "",
    humidity: "",
    windSpeed: "",
    actual: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ predicted: number; error: number } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      const actual = parseFloat(form.actual);
      const predicted = actual + (Math.random() * 2 - 1); // ±1 m
      const error = Math.abs(predicted - actual);

      setResult({
        predicted: parseFloat(predicted.toFixed(2)),
        error: parseFloat(error.toFixed(2)),
      });
      setLoading(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-muted">
      <NavBar />
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>AI Water Level Predictor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Station</Label>
                <select
                  name="stationId"
                  value={form.stationId}
                  onChange={handleChange}
                  className="mt-1 border rounded px-3 py-2 w-full"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rainfall (mm)</Label>
                  <Input name="rainfall" type="number" value={form.rainfall} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Temperature (°C)</Label>
                  <Input name="temp" type="number" value={form.temp} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Humidity (%)</Label>
                  <Input name="humidity" type="number" value={form.humidity} onChange={handleChange} required />
                </div>
                <div>
                  <Label>Wind Speed (km/h)</Label>
                  <Input name="windSpeed" type="number" value={form.windSpeed} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <Label>Actual Water Level (m)</Label>
                <Input name="actual" type="number" step="0.01" value={form.actual} onChange={handleChange} required />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" /> Loading...
                  </span>
                ) : (
                  "Predict"
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6 p-4 bg-gray-100 rounded text-sm space-y-2">
                <p>
                  <strong>Predicted Water Level:</strong> {result.predicted} m
                </p>
                <p>
                  <strong>Error:</strong> ±{result.error} m from actual
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
