import React, { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import clsx from "clsx";
import {
  predictWaterlogging,
  sendFeedback,
  getStations,
  getWeights,
  updateWeights,
} from "@/lib/api";

export default function WaterLevelPredictor() {
  const [stations, setStations] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    stationId: 1,
    rainfall: "",
    temp: "",
    humidity: "",
    windSpeed: "",
    actual: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [weights, setWeights] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    getStations()
      .then((res) => setStations(res.data.stations || []))
      .catch(() => toast({ title: "Failed to load stations" }));

    getWeights()
      .then((res) => setWeights(res.data.weights))
      .catch(() => toast({ title: "Failed to load weights" }));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const predictRes = await predictWaterlogging({
        station_code: String(form.stationId),
        rainfall: parseFloat(form.rainfall),
        timestamp: new Date().toISOString(),
        weather: 1,
        windspeed: parseFloat(form.windSpeed),
      });

      const prediction = predictRes.data?.prediction;
      const actual = parseFloat(form.actual);
      const predicted = prediction?.waterlogging_depth || 0;
      const error = Math.abs(predicted - actual);

      setResult({
        ...prediction,
        error: parseFloat(error.toFixed(2)),
      });

      await sendFeedback({
        station_code: String(form.stationId),
        rainfall: parseFloat(form.rainfall),
        timestamp: new Date().toISOString(),
        weather: 1,
        windspeed: parseFloat(form.windSpeed),
        actual_waterdepth: actual,
      });

      toast({ title: "Prediction successful", description: "Feedback also submitted." });
    } catch {
      toast({ title: "Error", description: "Could not predict or submit feedback." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWeights = async () => {
    const suggested = getSuggestedWeights(weights);
    try {
      await updateWeights({ weights: suggested });
      toast({ title: "Weights updated successfully" });
      setWeights(suggested); // reflect immediately
    } catch {
      toast({ title: "Update failed", description: "Please try again." });
    }
  };

  const getSuggestedWeights = (w: Record<string, number> | null) => {
    if (!w) return {};
    // Simple logic: increase amplification weight slightly, normalize others
    const updated = {
      ...w,
      amplification_factor: Math.min(w.amplification_factor + 0.1, 1.0),
    };

    const total = Object.values(updated).reduce((acc, v) => acc + v, 0);
    Object.keys(updated).forEach((k) => (updated[k] = parseFloat((updated[k] / total).toFixed(2))));

    return updated;
  };

  const riskLevelColor = (level: string) =>
    clsx("text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide", {
      "bg-green-200 text-green-800": level === "low",
      "bg-yellow-200 text-yellow-900": level === "moderate",
      "bg-red-200 text-red-800": level === "high",
    });

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
                {stations.length > 0 ? (
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
                ) : (
                  <div className="text-gray-500 text-sm">
                    Loading station list...
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rainfall (mm)</Label>
                  <Input
                    name="rainfall"
                    type="number"
                    value={form.rainfall}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label>Temperature (°C)</Label>
                  <Input
                    name="temp"
                    type="number"
                    value={form.temp}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label>Humidity (%)</Label>
                  <Input
                    name="humidity"
                    type="number"
                    value={form.humidity}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label>Wind Speed (km/h)</Label>
                  <Input
                    name="windSpeed"
                    type="number"
                    value={form.windSpeed}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Actual Water Level (m)</Label>
                <Input
                  name="actual"
                  type="number"
                  step="0.01"
                  value={form.actual}
                  onChange={handleChange}
                  required
                />
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
              <div className="mt-6 space-y-6">
                {/* Prediction Summary */}
                <Card className="border-none shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardContent className="p-5 space-y-2 text-gray-800">
                    <h3 className="text-xl font-bold text-blue-800">📊 Prediction Summary</h3>
                    <p><strong>Predicted Water Level:</strong> {result.waterlogging_depth} m</p>
                    <p><strong>Error from Actual:</strong> ±{result.error} m</p>
                    <p><strong>Amplification Factor:</strong> {result.risk_factor.amplification_factor}</p>
                    <p className="flex items-center gap-2">
                      <strong>Risk Score:</strong> {result.risk_factor.risk_score}
                      <span className={riskLevelColor(result.risk_factor.risk_level)}>
                        {result.risk_factor.risk_level}
                      </span>
                    </p>
                  </CardContent>
                </Card>

                {/* Contributing Factors */}
                <Card className="border-none shadow-md bg-gradient-to-r from-orange-50 to-orange-100">
                  <CardContent className="p-5">
                    <h3 className="text-xl font-bold text-orange-800 mb-4">🧮 Contributing Factors</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(result.risk_factor.factors).map(([key, value]) => (
                        <div
                          key={key}
                          className="bg-white rounded-lg px-3 py-2 shadow-sm border border-orange-200"
                        >
                          <strong className="block text-gray-700">
                            {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:
                          </strong>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Weights Panel */}
                {weights && (
                  <Card className="border-none shadow-md bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardContent className="p-5 space-y-3">
                      <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                        ⚙️ Risk Weights
                      </h3>

                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-800">
                        <div className="font-semibold text-gray-600">Current</div>
                        <div></div>
                        <div className="font-semibold text-gray-600">Suggested</div>

                        {Object.keys(weights).map((key) => {
                          const current = weights[key];
                          const suggested = getSuggestedWeights(weights)[key];
                          const changed = suggested !== current;
                          const color = suggested > current ? "text-green-600" : "text-red-600";

                          return (
                            <React.Fragment key={key}>
                              <div className="capitalize">{key.replace(/_/g, " ")}: {current}</div>
                              <div className="text-center">→</div>
                              <div className={clsx("capitalize", changed && color)}>
                                {key.replace(/_/g, " ")}: {suggested}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <div className="flex justify-center mt-4">
                        <Button onClick={handleUpdateWeights}>
                          Update Weights
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
