import React, { useState, useEffect, useRef } from 'react';
import client from '../utils/api';
import { Map, Layers, Target, Save, Search, MapPin, Plus, Trash2, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Polygon, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Component to handle map clicks for polygon drawing
const MapClickHandler = ({ onMapClick, isDrawing }) => {
    useMapEvents({
        click: (e) => {
            if (isDrawing) {
                onMapClick(e.latlng);
            }
        }
    });
    return null;
};

const TerritoryManager = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await client.get('/admin/employees');
            setEmployees(res.data.filter(e => e.employee_type === 'field' || e.employee_type === 'FIELD'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const selectEmployee = (emp) => {
        setSelectedEmployee({ ...emp });
        setPolygonPoints(emp.territory_polygon || []);
        setIsDrawing(false);
        setSuccessMsg('');
    };

    const handleMapClick = (latlng) => {
        const newPoint = { lat: latlng.lat, lng: latlng.lng };
        setPolygonPoints(prev => [...prev, newPoint]);
    };

    const removePolygonPoint = (index) => {
        setPolygonPoints(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateTerritory = async () => {
        if (!selectedEmployee) return;
        setSaving(true);
        setSuccessMsg('');
        try {
            const territoryType = selectedEmployee.territory_type || 'radius';
            const payload = { territory_type: territoryType };

            if (territoryType === 'polygon' || territoryType === 'POLYGON') {
                payload.territory_polygon = polygonPoints;
            } else {
                payload.territory_center_lat = parseFloat(selectedEmployee.territory_center_lat);
                payload.territory_center_lng = parseFloat(selectedEmployee.territory_center_lng);
                payload.territory_radius_meters = parseFloat(selectedEmployee.territory_radius_meters);
            }

            await client.put(`/admin/employees/${selectedEmployee.email}/territory`, payload);
            setSuccessMsg('Territory boundaries saved successfully!');
            fetchEmployees();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (e) {
            alert('Failed to update territory: ' + (e.response?.data?.detail || e.message));
        } finally {
            setSaving(false);
        }
    };

    const isPolygonMode = selectedEmployee?.territory_type === 'polygon' || selectedEmployee?.territory_type === 'POLYGON';
    const mapCenter = selectedEmployee?.territory_center_lat
        ? [parseFloat(selectedEmployee.territory_center_lat), parseFloat(selectedEmployee.territory_center_lng)]
        : [20.5937, 78.9629];
    const mapZoom = selectedEmployee?.territory_center_lat ? 14 : 5;

    const filteredEmployees = employees.filter(e =>
        e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full gap-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Target className="text-primary-500" /> Territory & Geofence Manager
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Define jurisdiction boundaries for field agents — radius or custom polygon</p>
                </div>
                {successMsg && (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-medium animate-pulse">
                        ✓ {successMsg}
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
                {/* Agent Selector */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search Field Agents..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary-500 outline-none transition"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">No field agents found</p>
                        ) : (
                            filteredEmployees.map(emp => (
                                <button
                                    key={emp.email}
                                    onClick={() => selectEmployee(emp)}
                                    className={`w-full text-left p-3.5 rounded-2xl transition-all border ${selectedEmployee?.email === emp.email
                                            ? 'bg-primary-500/10 border-primary-500/50 shadow-lg shadow-primary-500/5'
                                            : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    <span className="text-white font-semibold block text-sm">{emp.full_name}</span>
                                    <span className="text-xs text-slate-500">{emp.designation || 'Field Agent'}</span>
                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${emp.territory_type
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-slate-700 text-slate-400'
                                        }`}>
                                        {emp.territory_type || 'None'}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Configuration + Map */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {selectedEmployee ? (
                        <>
                            {/* Controls Bar */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Boundary Type</label>
                                    <select
                                        value={selectedEmployee.territory_type || 'radius'}
                                        onChange={(e) => {
                                            setSelectedEmployee({ ...selectedEmployee, territory_type: e.target.value });
                                            if (e.target.value === 'polygon') setPolygonPoints(selectedEmployee.territory_polygon || []);
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary-500 outline-none"
                                    >
                                        <option value="radius">📍 Circular (Radius)</option>
                                        <option value="polygon">🗺️ Custom Polygon</option>
                                    </select>
                                </div>

                                {!isPolygonMode ? (
                                    <>
                                        <div className="min-w-[140px]">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Center Lat</label>
                                            <input
                                                type="number" step="0.0001"
                                                value={selectedEmployee.territory_center_lat || ''}
                                                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, territory_center_lat: e.target.value })}
                                                placeholder="28.6139"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm"
                                            />
                                        </div>
                                        <div className="min-w-[140px]">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Center Lng</label>
                                            <input
                                                type="number" step="0.0001"
                                                value={selectedEmployee.territory_center_lng || ''}
                                                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, territory_center_lng: e.target.value })}
                                                placeholder="77.2090"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm"
                                            />
                                        </div>
                                        <div className="min-w-[140px]">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Radius (m)</label>
                                            <input
                                                type="number"
                                                value={selectedEmployee.territory_radius_meters || 500}
                                                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, territory_radius_meters: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-end gap-2">
                                        <button
                                            onClick={() => setIsDrawing(!isDrawing)}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isDrawing
                                                    ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                                    : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                                }`}
                                        >
                                            {isDrawing ? (
                                                <><Navigation size={14} /> Stop Drawing</>
                                            ) : (
                                                <><Plus size={14} /> Draw on Map</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setPolygonPoints([])}
                                            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <span className="text-xs text-slate-500 pb-2">{polygonPoints.length} vertices</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleUpdateTerritory}
                                    disabled={saving}
                                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50 text-sm ml-auto"
                                >
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>

                            {/* Live Map */}
                            <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden min-h-[450px]">
                                <MapContainer
                                    key={`${selectedEmployee.email}-${isPolygonMode}`}
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; CARTO'
                                    />
                                    <MapClickHandler onMapClick={handleMapClick} isDrawing={isDrawing} />

                                    {/* Radius Circle */}
                                    {!isPolygonMode && selectedEmployee.territory_center_lat && (
                                        <>
                                            <Circle
                                                center={[parseFloat(selectedEmployee.territory_center_lat), parseFloat(selectedEmployee.territory_center_lng)]}
                                                radius={parseFloat(selectedEmployee.territory_radius_meters) || 500}
                                                pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.15, weight: 2 }}
                                            />
                                            <Marker position={[parseFloat(selectedEmployee.territory_center_lat), parseFloat(selectedEmployee.territory_center_lng)]}>
                                                <Popup>{selectedEmployee.full_name}'s Territory Center</Popup>
                                            </Marker>
                                        </>
                                    )}

                                    {/* Polygon */}
                                    {isPolygonMode && polygonPoints.length >= 3 && (
                                        <Polygon
                                            positions={polygonPoints.map(p => [p.lat, p.lng])}
                                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 2 }}
                                        />
                                    )}

                                    {/* Polygon Points as Markers */}
                                    {isPolygonMode && polygonPoints.map((p, i) => (
                                        <Marker key={i} position={[p.lat, p.lng]}>
                                            <Popup>
                                                Point {i + 1}: {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                                                <br />
                                                <button
                                                    onClick={() => removePolygonPoint(i)}
                                                    style={{ color: 'red', cursor: 'pointer', border: 'none', background: 'none', textDecoration: 'underline' }}
                                                >
                                                    Remove
                                                </button>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>

                            {/* Polygon Points List (shown in polygon mode) */}
                            {isPolygonMode && polygonPoints.length > 0 && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                                    <h3 className="text-sm font-bold text-slate-400 mb-2">Polygon Vertices ({polygonPoints.length})</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {polygonPoints.map((p, i) => (
                                            <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border border-slate-700">
                                                <span className="text-emerald-400 font-bold">{i + 1}</span>
                                                {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                                                <button onClick={() => removePolygonPoint(i)} className="text-rose-400 hover:text-rose-300 ml-1">
                                                    <Trash2 size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
                            <Target size={64} className="text-slate-800 mb-4" />
                            <h3 className="text-slate-400 text-lg">Select an agent to manage their territory</h3>
                            <p className="text-slate-600 max-w-sm mt-2">
                                Territories ensure field staff operate within their assigned sales jurisdictions.
                                Choose <strong className="text-slate-400">Circular</strong> for simple radius or <strong className="text-emerald-500">Polygon</strong> for precise boundaries.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TerritoryManager;
