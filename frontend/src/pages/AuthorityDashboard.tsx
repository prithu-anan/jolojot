import React, { useState } from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "leaflet/dist/leaflet.css";

// --- Type for graph points ---
interface StationDataPoint {
  timestamp: string;
  waterlogging: number;
  rainfall: number;
  riskfactor: number;
}

// --- Generate timestamps: 12 half-hour intervals from 6:00 to 11:30
const generateTimestamps = () =>
  Array.from({ length: 12 }, (_, i) => {
    const hour = 6 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

const dummyGraphData: Record<number, StationDataPoint[]> = {
  1: generateTimestamps().map((t, i) => ({
    timestamp: t,
    waterlogging: 1 + Math.sin(i / 2) * 0.3,
    rainfall: 8 + Math.cos(i / 3) * 2,
    riskfactor: 1.5 + Math.sin(i / 3) * 0.5,
  })),
  2: generateTimestamps().map((t, i) => ({
    timestamp: t,
    waterlogging: 2 + Math.sin(i / 2) * 0.2,
    rainfall: 6 + Math.cos(i / 3) * 1.5,
    riskfactor: 1.2 + Math.cos(i / 4) * 0.4,
  })),
  3: generateTimestamps().map((t, i) => ({
    timestamp: t,
    waterlogging: 0.9 + Math.sin(i / 2) * 0.4,
    rainfall: 5 + Math.cos(i / 3) * 1.8,
    riskfactor: 1.0 + Math.sin(i / 3) * 0.3,
  })),
};

const stations = [
  { id: 1, name: "Station A", lat: 23.8103, lon: 90.4125 },
  { id: 2, name: "Station B", lat: 23.7000, lon: 90.3750 },
  { id: 3, name: "Station C", lat: 23.7800, lon: 90.4200 },
];

const stationFeedback: Record<number, { user: string; comment: string }[]> = {
  1: [
    { user: "Hasan", comment: "Water levels rise quickly here after heavy rain." },
    { user: "Farzana", comment: "Drainage improvements are working recently." },
  ],
  2: [
    { user: "Tariq", comment: "Area remains flooded during monsoon." },
    { user: "Mitu", comment: "A key intersection affected by waterlogging." },
  ],
  3: [
    { user: "Rayhan", comment: "No major issue unless there's a storm." },
  ],
};

const AuthorityDashboard: React.FC = () => {
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editedLat, setEditedLat] = useState<number>(0);
  const [editedLon, setEditedLon] = useState<number>(0);
  const [selectedHours, setSelectedHours] = useState<number>(3); // ⏱ last N hours

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rawData = selectedStationId ? dummyGraphData[selectedStationId] : [];
  const graphData = rawData.slice(-selectedHours * 2); // 2 points/hour

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 relative z-0">
        {/* Header and Search */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Authority Dashboard</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={() => alert("Search clicked!")}>Go</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Map + Info */}
          <div className="space-y-6">
            <Card className="relative z-0">
              <CardHeader>
                <CardTitle>Monitoring Stations Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <MapContainer
                    center={[23.8103, 90.4125]}
                    zoom={12}
                    scrollWheelZoom
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {filteredStations.map((station) => (
                      <Marker
                        key={station.id}
                        position={[station.lat, station.lon]}
                        eventHandlers={{
                          click: () => {
                            setSelectedStationId(station.id);
                            setEditedLat(station.lat);
                            setEditedLon(station.lon);
                          },
                        }}
                      >
                        <Popup>{station.name}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Feedback */}
            {selectedStationId && (
              <Card>
                <CardHeader>
                  <CardTitle>User Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(stationFeedback[selectedStationId] || []).map((fb, idx) => (
                    <div key={idx} className="bg-gray-100 p-3 rounded-md text-sm">
                      <p className="italic">"{fb.comment}"</p>
                      <p className="text-right text-xs text-gray-500 mt-1">— {fb.user}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Edit Location */}
            {selectedStationId && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Station Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      step="0.0001"
                      value={editedLat}
                      onChange={(e) => setEditedLat(parseFloat(e.target.value))}
                      placeholder="Latitude"
                    />
                    <Input
                      type="number"
                      step="0.0001"
                      value={editedLon}
                      onChange={(e) => setEditedLon(parseFloat(e.target.value))}
                      placeholder="Longitude"
                    />
                  </div>
                  <Button className="mt-3" onClick={() => alert("Coordinates updated (dummy logic).")}>
                    Save Location
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Graphs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Monitoring Graphs</CardTitle>
                {selectedStationId && (
                  <p className="text-sm text-muted-foreground">
                    Showing data for {stations.find((s) => s.id === selectedStationId)?.name}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Time Range:</span>
                    <select
											aria-label="Time Range"
											value={selectedHours}
											onChange={(e) => setSelectedHours(parseInt(e.target.value))}
											className="border rounded px-2 py-1 text-sm"
                    >
											{[1, 2, 3, 4, 5, 6].map((h) => (
												<option key={h} value={h}>
													Last {h} hour{h > 1 && "s"}
												</option>
											))}
                    </select>
                </div>
              </CardContent>
            </Card>
            {["waterlogging", "rainfall", "riskfactor"].map((metric, i) => (
              <Card key={metric}>
                <CardHeader>
                  <CardTitle className="capitalize">{metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={graphData}>
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey={metric}
                        stroke={["#3b82f6", "#10b981", "#ef4444"][i]}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
