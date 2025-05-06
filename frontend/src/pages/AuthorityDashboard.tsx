import React, { useEffect, useState, useRef } from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "leaflet/dist/leaflet.css";
import { Map as LeafletMap } from "leaflet";
import { getStations, updateStationLocation, getStationDataByHour } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface Station {
  id: number;
  name: string;
  lat: number;
  lon: number;
  details: {
    elevation: string;
    landCover: string;
    drainage: string;
    slope: string;
    proximity: string;
  };
}

interface Feedback {
  user: string;
  comment: string;
}

interface StationDataPoint {
  timestamp: string;
  waterlogging: number;
  rainfall: number;
  riskfactor: number;
}

const AuthorityDashboard: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stationData, setStationData] = useState<StationDataPoint[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [editedLat, setEditedLat] = useState<number>(0);
  const [editedLon, setEditedLon] = useState<number>(0);
  const [selectedHours, setSelectedHours] = useState<number>(3);

  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    getStations()
      .then((res) => setStations(res.data.stations || []))
      .catch(() => toast({ title: "Failed to load stations" }));
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      getStationDataByHour(selectedStationId, selectedHours)
        .then((res) => {
          setStationData(res.data.data || []);
          setFeedbacks(res.data.feedback || []);
          const lat = parseFloat(res.data.station.lat);
          const lon = parseFloat(res.data.station.lon);
          setEditedLat(isNaN(lat) ? 0 : lat);
          setEditedLon(isNaN(lon) ? 0 : lon);
        })
        .catch(() => toast({ title: "Failed to load station data" }));
    }
  }, [selectedStationId, selectedHours]);

  const handleLocationUpdate = async () => {
    if (!selectedStationId) return;
    try {
      await updateStationLocation(selectedStationId, { lat: editedLat, lon: editedLon });
      toast({ title: "Location updated successfully" });
    } catch {
      toast({ title: "Failed to update location", description: "Try again later" });
    }
  };

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 relative z-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Authority Dashboard</h1>
          <div className="relative max-w-xs w-full">
            <Input
              placeholder="Search station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {}}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Map + Feedback + Edit */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Station Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <MapContainer
                    center={[23.8103, 90.4125]}
                    zoom={12}
                    scrollWheelZoom
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                    whenReady={({ target }) => {
                      mapRef.current = target as LeafletMap;
                    }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {filteredStations.map((station) => (
                      <Marker
                        key={station.id}
                        position={[station.lat, station.lon]}
                        eventHandlers={{
                          click: () => {
                            setSelectedStationId(station.id);
                            mapRef.current?.flyTo([station.lat, station.lon], 14);
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
            {selectedStationId && feedbacks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>User Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feedbacks.map((fb, idx) => (
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
                  <CardTitle>Edit Station Coordinates</CardTitle>
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
                  <Button className="mt-3" onClick={handleLocationUpdate}>
                    Save Location
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Graphs + Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Monitoring Graphs</CardTitle>
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
              stationData.length > 0 && (
                <Card key={metric}>
                  <CardHeader>
                    <CardTitle className="capitalize">{metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={stationData}>
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
              )
            ))}

            {selectedStationId && (
              <Card>
                <CardHeader>
                  <CardTitle>Station Geospatial Info</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm text-muted-foreground">
                  {Object.entries(
                    stations.find((s) => s.id === selectedStationId)?.details || {}
                  ).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">
                        {key.replace(/([a-z])([A-Z])/g, "$1 $2")}:{" "}
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
