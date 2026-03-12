import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Polygon, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import client from '../utils/api';
import { Users, MapPin, Navigation, AlertTriangle, Clock, Route, ShieldCheck, EyeOff } from 'lucide-react';
import L from 'leaflet';
import 'leaflet.heat'; // Add this for heatmap support

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker for Agents with Pulsating Animation
const agentMarkerIcon = (color) => L.divIcon({
    html: `
        <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; background-color: ${color}; opacity: 0.4; border-radius: 50%; animation: pulse 2s infinite;"></div>
            <div style="position: relative; background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>
        </div>
        <style>
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.4; }
                70% { transform: scale(2.5); opacity: 0; }
                100% { transform: scale(1); opacity: 0; }
            }
        </style>
    `,
    className: 'custom-agent-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Utility to slightly offset markers that are at the exact same location
const jitter = (coord) => coord + (Math.random() - 0.5) * 0.0001;

const ZoomToSelection = ({ center }) => {
    const map = useMap();
    useEffect(() => { if (center) map.flyTo(center, 15); }, [center, map]);
    return null;
};

const HeatmapLayer = ({ data, visible }) => {
    const map = useMap();
    useEffect(() => {
        if (!visible || !data.length) return;
        const heat = L.heatLayer(data, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);
        return () => map.removeLayer(heat);
    }, [data, visible, map]);
    return null;
};

const FieldWarRoom = () => {
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [agentTrail, setAgentTrail] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ active: 0, idle: 0, breach: 0 });
    const [heatmapData, setHeatmapData] = useState([]);
    const [showHeatmap, setShowHeatmap] = useState(false);

    useEffect(() => {
        fetchAgentLocations();
        fetchHeatmapData();
        const interval = setInterval(() => {
            fetchAgentLocations();
            if (showHeatmap) fetchHeatmapData();
        }, 10000); // Live tracking: 10s updates
        return () => clearInterval(interval);
    }, [showHeatmap]);

    const fetchAgentLocations = async () => {
        try {
            const res = await client.get('/admin/field/live-status');
            setAgents(res.data.agents || []);
            setStats(res.data.stats || { active: 0, idle: 0, breach: 0 });
        } catch (e) {
            console.error('Failed to fetch live status', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchHeatmapData = async () => {
        try {
            const res = await client.get('/admin/field/heatmap-data');
            setHeatmapData(res.data || []);
        } catch (e) {
            console.error('Failed to fetch heatmap data', e);
        }
    };

    const fetchAgentHistory = async (agent) => {
        setSelectedAgent(agent);
        try {
            const res = await client.get(`/admin/field/trail/${agent.email}`);
            setAgentTrail(res.data.trail || []);
        } catch (e) {
            console.error('History fetch failed', e);
            setAgentTrail([]);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'On-Site') return '#10b981'; // Emerald
        if (status === 'Traveling') return '#f59e0b'; // Amber/Yellow
        if (status === 'Idle') return '#64748b'; // Slate
        return '#ef4444'; // Red for Inactive
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <header className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Route className="text-primary-500" /> Field War Room
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Live Zomato-style tracking (Active Duty Only)</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`px-4 py-2 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold ${showHeatmap ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                        <EyeOff size={16} /> Heatmap {showHeatmap ? 'ON' : 'OFF'}
                    </button>
                    <StatCard icon={Users} label="On-Site" value={agents.filter(a => a.status === 'On-Site').length} color="emerald" />
                    <StatCard icon={Navigation} label="En Route" value={agents.filter(a => a.status === 'Traveling').length} color="amber" />
                    <div className="bg-slate-950/50 px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-3">
                        <ShieldCheck className="text-primary-500" size={18} />
                        <div>
                            <span className="text-[10px] uppercase font-bold opacity-60 block text-primary-500">Privacy Shield</span>
                            <span className="text-xs font-bold text-white">Duty Filter ON</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
                {/* Agent List */}
                <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-800/20 flex items-center justify-between border-b border-slate-800">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Agents</span>
                        <div className="flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] text-emerald-500 font-bold">LIVE</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {agents.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => fetchAgentHistory(agent)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedAgent?.id === agent.id ? 'bg-primary-500/10 border-primary-500/50 shadow-lg' : 'hover:bg-slate-800/50 border-transparent'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white text-sm">{agent.name}</span>
                                    <span
                                        className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                        style={{ backgroundColor: `${getStatusColor(agent.status)}20`, color: getStatusColor(agent.status) }}
                                    >
                                        {agent.status}
                                    </span>
                                </div>
                                {agent.current_visit && (
                                    <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase">At: {agent.current_visit}</p>
                                )}
                                <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Navigation size={12} className="text-primary-500" /> {agent.km_today || 0} km
                                    </div>
                                    <span className="opacity-40 text-[9px]">{agent.last_ping ? new Date(agent.last_ping).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Map View */}
                <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl">
                    <MapContainer
                        center={[20.5937, 78.9629]}
                        zoom={5}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <LayersControl position="topright">
                            <LayersControl.BaseLayer checked name="Dark Map">
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="Street Map">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="Satellite">
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                            </LayersControl.BaseLayer>
                        </LayersControl>

                        {/* Render Territory Overlays */}
                        {agents.map(agent => {
                            if (!agent.territory) return null;
                            if (agent.territory.type === 'radius' && agent.territory.center) {
                                return (
                                    <Circle
                                        key={`territory-${agent.id}`}
                                        center={[agent.territory.center.lat, agent.territory.center.lng]}
                                        radius={agent.territory.radius || 1000}
                                        pathOptions={{ color: '#10b981', fillOpacity: 0.1, dashArray: '5, 5', weight: 2 }}
                                    />
                                );
                            } else if (agent.territory.type === 'polygon' && agent.territory.polygon) {
                                return (
                                    <Polygon
                                        key={`territory-${agent.id}`}
                                        positions={agent.territory.polygon.map(p => [p.lat, p.lng])}
                                        pathOptions={{ color: '#10b981', fillOpacity: 0.1, weight: 2 }}
                                    />
                                );
                            }
                            return null;
                        })}

                        {selectedAgent && selectedAgent.lat && <ZoomToSelection center={[selectedAgent.lat, selectedAgent.lng]} />}

                        {agents.map(agent => agent.lat && (
                            <Marker
                                key={agent.id}
                                position={[jitter(agent.lat), jitter(agent.lng)]}
                                icon={agentMarkerIcon(getStatusColor(agent.status))}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-3 bg-slate-900 rounded-lg min-w-[200px]">
                                        <h3 className="font-bold text-white mb-1">{agent.name}</h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: getStatusColor(agent.status) }}
                                            />
                                            <span className="text-[10px] font-bold uppercase" style={{ color: getStatusColor(agent.status) }}>
                                                {agent.status}
                                            </span>
                                        </div>

                                        {agent.current_visit && (
                                            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 mb-3">
                                                <p className="text-[8px] text-slate-500 uppercase font-bold">Current Visit</p>
                                                <p className="text-xs text-emerald-400 font-bold">{agent.current_visit}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-bold">Coverage</p>
                                                <p className="text-sm font-bold text-white">{agent.km_today || 0} KM</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-bold">Last Active</p>
                                                <p className="text-sm font-bold text-white">{agent.last_ping ? new Date(agent.last_ping).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const res = await client.post(`/admin/field/generate-otp/${agent.email}`);
                                                        alert(`OTP for ${agent.name}: ${res.data.otp}\nExpires in 5 minutes.`);
                                                    } catch (err) {
                                                        alert("Failed to generate OTP");
                                                    }
                                                }}
                                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                                            >
                                                <ShieldCheck size={14} /> Generate GPS OTP
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {selectedAgent && agentTrail.length > 0 && (
                            <Polyline
                                positions={agentTrail}
                                pathOptions={{ color: '#6366f1', weight: 4, opacity: 0.6, dashArray: '10, 10' }}
                            />
                        )}
                        <HeatmapLayer data={heatmapData} visible={showHeatmap} />
                    </MapContainer>

                    {/* Overlay Privacy Tooltip */}
                    <div className="absolute bottom-6 left-6 z-[1000] bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
                        <EyeOff size={14} className="text-amber-500" />
                        Tracking hidden for employees NOT currently checked-in.
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    };
    return (
        <div className={`px-5 py-3 rounded-2xl border ${colors[color]} flex items-center gap-4`}>
            <div className="p-2 rounded-xl bg-slate-950/20">
                <Icon size={20} />
            </div>
            <div>
                <span className="text-[10px] uppercase font-bold opacity-60 block leading-none tracking-tighter">{label}</span>
                <span className="text-xl font-bold block mt-1">{value}</span>
            </div>
        </div>
    );
};

export default FieldWarRoom;
