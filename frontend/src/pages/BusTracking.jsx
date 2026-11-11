// @ts-nocheck
import { useState, useEffect } from 'react';
import {
  Bus, MapPin, Phone, MessageCircle, Navigation,
  Clock, CheckCircle, Users, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// CONFIG — change these to your real values
// ─────────────────────────────────────────────
const SCHOOL = {
  name:  'Greenfield Public School',
  phone: '080-12345678',
  lat:   12.9716,
  lng:   77.5946,
};

// Your backend API base URL
const API_BASE = 'http://localhost:5000/api';

// How often to refresh GPS (milliseconds)
const REFRESH_INTERVAL = 30000; // 30 seconds

// ─────────────────────────────────────────────
// DEMO fallback data (shown when backend is offline)
// ─────────────────────────────────────────────
const DEMO_BUSES = [
  {
    _id: 'b1',
    vehicleNumber: 'KA-01-F-1234',
    routeNumber: '01',
    routeName: 'North Route',
    driverName: 'Ramesh Kumar',
    driverPhone: '9876543210',
    capacity: 50,
    studentsOnBoard: 42,
    status: 'On Route',
    speed: 35,
    lat: 12.9916,
    lng: 77.5746,
    nextStop: 'Bus Stand',
    nextStopETA: '7 min',
    lastUpdated: new Date().toISOString(),
    stops: [
      { name: 'Main Gate',       time: '7:00 AM', status: 'done',    lat: 12.9316, lng: 77.5346 },
      { name: 'Bus Stand',       time: '7:20 AM', status: 'next',    lat: 12.9916, lng: 77.5746 },
      { name: 'Market',          time: '7:35 AM', status: 'pending', lat: 13.0116, lng: 77.5946 },
      { name: 'Railway Station', time: '7:50 AM', status: 'pending', lat: 13.0316, lng: 77.6146 },
      { name: 'School',          time: '8:10 AM', status: 'pending', lat: 12.9716, lng: 77.5946 },
    ],
  },
  {
    _id: 'b2',
    vehicleNumber: 'KA-01-G-5678',
    routeNumber: '02',
    routeName: 'South Route',
    driverName: 'Mahesh Reddy',
    driverPhone: '9876543220',
    capacity: 45,
    studentsOnBoard: 38,
    status: 'At Stop',
    speed: 0,
    lat: 12.9416,
    lng: 77.6146,
    nextStop: 'Jayanagar',
    nextStopETA: '3 min',
    lastUpdated: new Date().toISOString(),
    stops: [
      { name: 'School Gate', time: '7:00 AM', status: 'done',    lat: 12.9716, lng: 77.5946 },
      { name: 'RV Road',     time: '7:25 AM', status: 'done',    lat: 12.9416, lng: 77.6146 },
      { name: 'Jayanagar',   time: '7:45 AM', status: 'next',    lat: 12.9216, lng: 77.6346 },
      { name: 'JP Nagar',    time: '8:00 AM', status: 'pending', lat: 12.9016, lng: 77.6146 },
    ],
  },
];

const DEMO_STUDENTS = [
  { _id: 's1', name: 'Arjun Sharma',    admNo: 'ADM001', class: '10', busId: 'b1', stop: 'Bus Stand',       parentPhone: '9876543210', boardStatus: 'Not Boarded' },
  { _id: 's2', name: 'Priya Patel',     admNo: 'ADM002', class: '10', busId: 'b1', stop: 'Market',          parentPhone: '9876543211', boardStatus: 'Boarded'     },
  { _id: 's3', name: 'Rahul Kumar',     admNo: 'ADM003', class: '9',  busId: 'b2', stop: 'RV Road',         parentPhone: '9876543212', boardStatus: 'Boarded'     },
  { _id: 's4', name: 'Sneha Reddy',     admNo: 'ADM004', class: '9',  busId: 'b2', stop: 'Jayanagar',       parentPhone: '9876543213', boardStatus: 'Not Boarded' },
  { _id: 's5', name: 'Sidda Madabhavi', admNo: '123',    class: '10', busId: 'b1', stop: 'Railway Station', parentPhone: '9008303681', boardStatus: 'Not Boarded' },
  { _id: 's6', name: 'siddu madabhavi', admNo: '11',     class: '11', busId: 'b1', stop: 'Bus Stand',       parentPhone: '6362168219', boardStatus: 'Not Boarded' },
  { _id: 's7', name: 'roshan prabhu',   admNo: '234444', class: '10', busId: 'b2', stop: 'Market',          parentPhone: '',           boardStatus: 'Not Boarded' },
];

// ─────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────
const BUS_STATUS = {
  'On Route':  { color: '#16a34a', bg: '#dcfce7', emoji: '🟢' },
  'At Stop':   { color: '#d97706', bg: '#fef9c3', emoji: '🟡' },
  'At School': { color: '#3b82f6', bg: '#dbeafe', emoji: '🔵' },
  'Off Duty':  { color: '#94a3b8', bg: '#f1f5f9', emoji: '⚫' },
};

const STOP_STATUS = {
  done:    { color: '#16a34a', bg: '#dcfce7', label: '✓ Done'    },
  next:    { color: '#d97706', bg: '#fef9c3', label: '→ Next'    },
  pending: { color: '#94a3b8', bg: '#f1f5f9', label: '○ Pending' },
};

// ─────────────────────────────────────────────
// GOOGLE MAPS LINK — opens real map in new tab
// ─────────────────────────────────────────────
function openGoogleMaps(lat, lng, label) {
  window.open(
    'https://www.google.com/maps?q=' + lat + ',' + lng + '&z=15&label=' + encodeURIComponent(label),
    '_blank'
  );
}

function openGoogleMapsRoute(stops) {
  if (!stops || stops.length < 2) return;
  const waypoints = stops.slice(1, -1).map(s => s.lat + ',' + s.lng).join('|');
  const origin    = stops[0].lat + ',' + stops[0].lng;
  const dest      = stops[stops.length - 1].lat + ',' + stops[stops.length - 1].lng;
  const url = 'https://www.google.com/maps/dir/?api=1'
    + '&origin=' + origin
    + '&destination=' + dest
    + (waypoints ? '&waypoints=' + waypoints : '')
    + '&travelmode=driving';
  window.open(url, '_blank');
}

// ─────────────────────────────────────────────
// SVG MINI MAP
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// REAL GOOGLE MAP — embedded iframe
// Shows actual satellite/road map with bus pin
// ─────────────────────────────────────────────
function LiveMap({ bus }) {
  const stops = bus.stops || [];

  // Build Google Maps Embed URL with bus location as center
  // No API key needed for basic embed
  const busLat = bus.lat || SCHOOL.lat;
  const busLng = bus.lng || SCHOOL.lng;

  // Build markers for all stops + bus
  const stopMarkers = stops.map((s, i) =>
    'markers=color:blue|label:' + (i + 1) + '|' + (s.lat || SCHOOL.lat) + ',' + (s.lng || SCHOOL.lng)
  ).join('&');

  const busMarker  = 'markers=color:red|label:B|size:large|' + busLat + ',' + busLng;
  const schoolMark = 'markers=color:green|label:S|' + SCHOOL.lat + ',' + SCHOOL.lng;

  // Google Static Maps API (no key needed for basic use up to 1000/day)
  const staticMapUrl = 'https://maps.googleapis.com/maps/api/staticmap'
    + '?center=' + busLat + ',' + busLng
    + '&zoom=13&size=800x400&scale=2&maptype=roadmap'
    + '&' + busMarker
    + '&' + schoolMark
    + (stopMarkers ? '&' + stopMarkers : '')
    + '&path=color:0x1e3a8aff|weight:4'
    + stops.map(s => '|' + (s.lat || SCHOOL.lat) + ',' + (s.lng || SCHOOL.lng)).join('');

  // OpenStreetMap embed (completely free, no API key)
  const osmUrl = 'https://www.openstreetmap.org/export/embed.html'
    + '?bbox=' + (busLng - 0.05) + ',' + (busLat - 0.05) + ',' + (busLng + 0.05) + ',' + (busLat + 0.05)
    + '&layer=mapnik'
    + '&marker=' + busLat + ',' + busLng;

  // Google Maps iframe embed (free, no API key)
  const googleEmbedUrl = 'https://maps.google.com/maps'
    + '?q=' + busLat + ',' + busLng
    + '&z=14&output=embed&t=m';

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>

      {/* Real Google Maps iframe */}
      <iframe
        title={'Live Map - ' + bus.vehicleNumber}
        src={googleEmbedUrl}
        width="100%"
        height="380"
        style={{ border: 'none', display: 'block' }}
        allowFullScreen
        loading="lazy"
      />

      {/* Overlay — bus info on top of map */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        background: 'rgba(255,255,255,.95)',
        borderRadius: 10, padding: '8px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,.15)',
        border: '1px solid #e2e8f0',
        minWidth: 180,
      }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a8a', marginBottom: 4 }}>
          🚌 {bus.vehicleNumber}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
          Route {bus.routeNumber}: {bus.routeName}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: (BUS_STATUS[bus.status] || BUS_STATUS['Off Duty']).bg,
            color: (BUS_STATUS[bus.status] || BUS_STATUS['Off Duty']).color }}>
            {(BUS_STATUS[bus.status] || BUS_STATUS['Off Duty']).emoji} {bus.status}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: '#fef9c3', color: '#d97706' }}>
            ⚡ {bus.speed} km/h
          </span>
        </div>
        {bus.nextStop !== '—' && (
          <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, marginTop: 4 }}>
            📍 Next: {bus.nextStop} · {bus.nextStopETA}
          </div>
        )}
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
          📌 {busLat.toFixed(4)}, {busLng.toFixed(4)}
        </div>
      </div>

      {/* Stop markers overlay — top right */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {/* Open in Google Maps */}
        <button
          onClick={() => openGoogleMapsRoute(bus.stops)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
            borderRadius: 8, background: '#1e3a8a', color: '#fff',
            border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,.2)',
          }}>
          🗺️ Full Route in Maps
        </button>

        {/* Open bus location */}
        <button
          onClick={() => openGoogleMaps(busLat, busLng, bus.vehicleNumber)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
            borderRadius: 8, background: '#fff', color: '#1e3a8a',
            border: '1px solid #1e3a8a', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,.1)',
          }}>
          📍 Bus Location
        </button>
      </div>

      {/* Stop list at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,.92)',
        borderTop: '1px solid #e2e8f0',
        padding: '8px 14px',
        display: 'flex', gap: 6, overflowX: 'auto',
      }}>
        {stops.map((s, i) => {
          const sc = STOP_STATUS[s.status] || STOP_STATUS.pending;
          return (
            <button key={i}
              onClick={() => openGoogleMaps(s.lat || SCHOOL.lat, s.lng || SCHOOL.lng, s.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                border: '1px solid ' + sc.color,
                background: sc.bg, color: sc.color,
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: sc.color,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              {s.name}
              <span style={{ fontSize: 9, opacity: .8 }}>{s.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// DRIVER GPS PANEL
// This is what the driver opens on their phone
// to share their real GPS location
// ─────────────────────────────────────────────
function DriverGPSPanel({ bus, onLocationUpdate }) {
  const [tracking,   setTracking]   = useState(false);
  const [watchId,    setWatchId]    = useState(null);
  const [gpsStatus,  setGpsStatus]  = useState('idle'); // idle | tracking | error
  const [lastCoords, setLastCoords] = useState(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }

    setGpsStatus('tracking');
    setTracking(true);
    toast.success('GPS tracking started!');

    let lastSent = 0;
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat:      position.coords.latitude,
          lng:      position.coords.longitude,
          speed:    position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0, // m/s to km/h
          accuracy: Math.round(position.coords.accuracy),
        };
        setLastCoords(coords);
        onLocationUpdate(bus._id, coords);

        // Send to backend (max once every 5 seconds)
        if (Date.now() - lastSent < 5000) return;
        lastSent = Date.now();
        fetch(API_BASE + '/bus-tracking/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('accessToken') },
          body: JSON.stringify({ busId: bus._id, ...coords }),
        }).catch(() => {
          // Backend offline — store locally
          const updates = JSON.parse(localStorage.getItem('busGPSUpdates') || '{}');
          updates[bus._id] = { ...coords, updatedAt: new Date().toISOString() };
          localStorage.setItem('busGPSUpdates', JSON.stringify(updates));
        });
      },
      (error) => {
        setGpsStatus('error');
        setTracking(false);
        toast.error('GPS error: ' + error.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setTracking(false);
    setGpsStatus('idle');
    setWatchId(null);
    toast('GPS tracking stopped');
  };

  return (
    <div style={{
      background: tracking ? '#f0fdf4' : '#f8fafc',
      border: '1px solid ' + (tracking ? '#bbf7d0' : '#e2e8f0'),
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        {tracking
          ? <><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 1s infinite' }} /> Live GPS Active</>
          : <><Navigation size={14} /> Start GPS Tracking</>
        }
      </div>

      {lastCoords && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            ['Latitude',  lastCoords.lat.toFixed(6)],
            ['Longitude', lastCoords.lng.toFixed(6)],
            ['Speed',     lastCoords.speed + ' km/h'],
            ['Accuracy',  lastCoords.accuracy + ' meters'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#fff', borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={tracking ? stopTracking : startTracking}
        style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: tracking ? '#ef4444' : '#16a34a',
          color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
        {tracking ? '⏹ Stop GPS Tracking' : '▶ Start GPS Tracking (Driver App)'}
      </button>

      <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
        {tracking
          ? 'Sharing live location every 5 seconds with school'
          : 'Driver opens this on their phone to share live location'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BUS CARD
// ─────────────────────────────────────────────
function BusCard({ bus, selected, onSelect, onWhatsApp }) {
  const sc  = BUS_STATUS[bus.status] || BUS_STATUS['Off Duty'];
  const pct = bus.capacity ? Math.round((bus.studentsOnBoard || 0) / bus.capacity * 100) : 0;
  const lastUpdate = new Date(bus.lastUpdated);
  const minsAgo    = Math.floor((Date.now() - lastUpdate) / 60000);

  return (
    <div onClick={() => onSelect(bus)}
      style={{
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        border: selected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        background: selected ? '#f8faff' : '#fff',
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,.1)' : 'none',
        marginBottom: 10, transition: 'all .15s',
      }}>
      <div style={{ height: 3, background: sc.color }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            🚌
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{bus.vehicleNumber}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                background: sc.bg, color: sc.color }}>{sc.emoji} {bus.status}</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Route {bus.routeNumber}: {bus.routeName}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={e => { e.stopPropagation(); openGoogleMaps(bus.lat, bus.lng, bus.vehicleNumber); }}
              title="Open in Google Maps"
              style={{ padding: 6, borderRadius: 7, border: '1px solid #bfdbfe',
                background: '#eff6ff', cursor: 'pointer', color: '#3b82f6', display: 'flex' }}>
              <MapPin size={12} />
            </button>
            <button onClick={e => { e.stopPropagation(); onWhatsApp(bus); }}
              title={'WhatsApp ' + bus.driverName}
              style={{ padding: 6, borderRadius: 7, border: '1px solid #25D366',
                background: '#f0fdf4', cursor: 'pointer', color: '#16a34a', display: 'flex' }}>
              <MessageCircle size={12} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
          {[
            ['Students',     bus.studentsOnBoard + '/' + bus.capacity],
            ['Speed',        bus.speed + ' km/h'],
            ['ETA',          bus.nextStopETA],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#f8fafc', borderRadius: 6, padding: '5px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: '#94a3b8' }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 800,
                color: k === 'ETA' && bus.nextStopETA !== '—' ? '#d97706' : '#0f172a' }}>{v}</div>
            </div>
          ))}
        </div>

        {bus.nextStop !== '—' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#d97706', fontWeight: 600, marginBottom: 8 }}>
            <Navigation size={11} /> Next: {bus.nextStop} · {bus.nextStopETA}
          </div>
        )}

        {/* Occupancy bar */}
        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: pct + '%', height: '100%', borderRadius: 2,
            background: pct > 90 ? '#ef4444' : pct > 70 ? '#d97706' : '#16a34a' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
          <span><Phone size={9} style={{ display: 'inline', marginRight: 2 }} />{bus.driverName}</span>
          <span><RefreshCw size={9} style={{ display: 'inline', marginRight: 2 }} />
            {minsAgo === 0 ? 'Just now' : minsAgo + ' min ago'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN BUS TRACKING PAGE
// ─────────────────────────────────────────────
export default function BusTracking() {
  const [buses,       setBuses]       = useState(DEMO_BUSES);
  const [students,    setStudents]    = useState(DEMO_STUDENTS);
  const [selected,    setSelected]    = useState(DEMO_BUSES[0]);
  const [tab,         setTab]         = useState('map');
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [online,      setOnline]      = useState(true);
  const [showDriver,  setShowDriver]  = useState(false);

  // ── Fetch real students from backend ─────────
  const fetchStudents = async () => {
    // Students loaded from demo data — no API call needed
    // Demo data already has all 7 students pre-loaded in DEMO_STUDENTS
    // When backend bus-tracking route is added, students will load from there
  };

  // ── Fetch real GPS data from backend ────────
  const fetchLiveData = async () => {
    try {
      const res  = await fetch(API_BASE + '/bus-tracking/live', { headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') } });
      // If 404 - route not set up yet, stop trying (use demo data)
      if (res.status === 404) { setOnline(false); setLastRefresh(new Date()); return; }
      // If 401 - need auth, stop trying
      if (res.status === 401) { setOnline(false); setLastRefresh(new Date()); return; }
      if (!res.ok) throw new Error('Server error');
      const json = await res.json();
      const data = json.data || json;
      if (data && Array.isArray(data) && data.length > 0) {
        setBuses(data);
        setOnline(true);
      } else {
        setOnline(true);
      }
    } catch {
      setOnline(false);
      const stored = JSON.parse(localStorage.getItem('busGPSUpdates') || '{}');
      if (Object.keys(stored).length > 0) {
        setBuses(prev => prev.map(b => {
          const upd = stored[b._id];
          if (upd) return { ...b, lat: upd.lat, lng: upd.lng, speed: upd.speed, lastUpdated: upd.updatedAt };
          return b;
        }));
      }
    }
    setLastRefresh(new Date());
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchLiveData();
    fetchStudents();
    const interval = setInterval(fetchLiveData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // ── Handle driver GPS update ─────────────────
  const handleLocationUpdate = (busId, coords) => {
    setBuses(prev => prev.map(b =>
      b._id === busId
        ? { ...b, lat: coords.lat, lng: coords.lng, speed: coords.speed, lastUpdated: new Date().toISOString() }
        : b
    ));
    if (selected && selected._id === busId) {
      setSelected(prev => ({ ...prev, lat: coords.lat, lng: coords.lng, speed: coords.speed }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLiveData();
    setRefreshing(false);
    toast.success('Location refreshed!');
  };

  const handleWhatsApp = (bus) => {
    const raw = (bus.driverPhone || '').replace(/\D/g, '');
    const ph  = raw.startsWith('91') ? raw : '91' + raw;
    window.open('https://wa.me/' + ph, '_blank');
  };

  const notifyParent = (student) => {
    const bus = buses.find(b => b._id === student.busId);
    if (!bus) return;
    const raw = (student.parentPhone || '').replace(/\D/g, '');
    if (!raw) { toast.error('No parent phone'); return; }
    const ph  = raw.startsWith('91') ? raw : '91' + raw;
    const mapsLink = 'https://www.google.com/maps?q=' + bus.lat + ',' + bus.lng;
    const msg = '🚌 *Bus Tracking Update*\n' + SCHOOL.name + '\n\n'
      + '👤 *Student:* ' + student.name + '\n'
      + '🚌 *Bus:* ' + bus.vehicleNumber + '\n'
      + '📍 *Next Stop:* ' + bus.nextStop + '\n'
      + '⏱️ *ETA:* ' + bus.nextStopETA + '\n'
      + '🟢 *Status:* ' + bus.status + '\n\n'
      + '🗺️ *Live Location:* ' + mapsLink + '\n\n'
      + '📞 Driver ' + bus.driverName + ': ' + bus.driverPhone + '\n'
      + '📞 School: ' + SCHOOL.phone;
    window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank');
    toast.success('Update sent to parent!');
  };

  const notifyAllParents = () => {
    const withPhone = students.filter(s => s.parentPhone);
    withPhone.forEach((s, i) => {
      setTimeout(() => notifyParent(s), i * 800);
    });
    toast.success('Sending to ' + withPhone.length + ' parents...');
  };

  const busStudents = students.filter(s => s.busId === selected?._id);
  const onRouteCount = buses.filter(b => b.status === 'On Route').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚌 Live Bus Tracking</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              color: online ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
              {online ? <Wifi size={12} /> : <WifiOff size={12} />}
              {online ? 'Connected to Backend' : 'Offline — Showing Demo Data'}
            </div>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>·</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowDriver(!showDriver)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
              borderRadius: 8, border: '1px solid #8b5cf6', background: showDriver ? '#8b5cf6' : '#fff',
              color: showDriver ? '#fff' : '#8b5cf6', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <Navigation size={13} /> Driver GPS Panel
          </button>
          <button onClick={notifyAllParents}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
              borderRadius: 8, border: '1px solid #25D366', background: '#f0fdf4',
              color: '#16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <MessageCircle size={13} /> Notify All Parents
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
              borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff',
              cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Driver GPS Panel */}
      {showDriver && selected && (
        <DriverGPSPanel bus={selected} onLocationUpdate={handleLocationUpdate} />
      )}

      {/* Backend setup guide (shown when offline) */}
      {!online && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#c2410c', marginBottom: 8 }}>
            ⚠️ Backend not connected — showing demo data
          </div>
          <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.7 }}>
            To enable <b>real GPS tracking</b>, add this route to your backend:<br />
            <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
              POST /api/bus-tracking/update — saves GPS from driver phone
            </code><br />
            <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
              GET  /api/bus-tracking/live  — returns all bus locations
            </code><br />
            Driver opens <b>Driver GPS Panel</b> on their phone → clicks Start → location updates every 5 seconds automatically.
          </div>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
        {[
          { label: 'Total Buses',  value: buses.length,                                        color: '#3b82f6', icon: Bus          },
          { label: 'On Route',     value: onRouteCount,                                        color: '#16a34a', icon: Navigation   },
          { label: 'At School',    value: buses.filter(b => b.status === 'At School').length,  color: '#8b5cf6', icon: CheckCircle  },
          { label: 'Students',     value: buses.reduce((s, b) => s + (b.studentsOnBoard || 0), 0), color: '#f59e0b', icon: Users   },
        ].map(k => (
          <div key={k.label} className="card"
            style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color }} />
            <div style={{ background: k.color + '18', borderRadius: 9, padding: 9 }}>
              <k.icon size={16} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9' }}>
        {[
          { id: 'map',      label: '🗺️ Live Map'    },
          { id: 'students', label: '👨‍🎓 Students'    },
          { id: 'alerts',   label: '🔔 Send Alerts' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 20px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, background: 'transparent',
              color:        tab === t.id ? '#1e40af' : '#64748b',
              borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Live Map tab */}
      {tab === 'map' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          {/* Bus list */}
          <div>
            {buses.map(bus => (
              <BusCard key={bus._id} bus={bus}
                selected={selected?._id === bus._id}
                onSelect={b => setSelected(b)}
                onWhatsApp={handleWhatsApp} />
            ))}
          </div>

          {/* Map + details */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Map */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🗺️ Route Map — {selected.routeName}</span>
                  <button onClick={() => openGoogleMaps(selected.lat, selected.lng, selected.vehicleNumber)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                      borderRadius: 7, border: '1px solid #3b82f6', background: '#eff6ff',
                      color: '#3b82f6', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    <MapPin size={11} /> Bus Location
                  </button>
                </div>
                <LiveMap bus={selected} />
              </div>

              {/* Stop timeline */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📍 Stop Timeline</div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 16, top: 16, bottom: 16,
                    width: 2, background: '#f1f5f9' }} />
                  {(selected.stops || []).map((s, i) => {
                    const sc = STOP_STATUS[s.status] || STOP_STATUS.pending;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, position: 'relative' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%',
                          background: sc.bg, border: '2px solid ' + sc.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800, color: sc.color, zIndex: 1, flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ paddingTop: 4, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontWeight: 700, fontSize: 13,
                                color: s.status === 'done' ? '#94a3b8' : s.status === 'next' ? '#d97706' : '#0f172a' }}>
                                {s.name}
                              </span>
                              {s.lat && s.lng && (
                                <button onClick={() => openGoogleMaps(s.lat, s.lng, s.name)}
                                  style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 5,
                                    border: '1px solid #bfdbfe', background: '#eff6ff',
                                    color: '#3b82f6', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>
                                  🗺️ Map
                                </button>
                              )}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px',
                              borderRadius: 12, background: sc.bg, color: sc.color }}>
                              {sc.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            <Clock size={9} style={{ display: 'inline', marginRight: 3 }} />{s.time}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Students on bus */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                  👨‍🎓 Students on {selected.vehicleNumber} ({busStudents.length})
                </div>
                {busStudents.map(s => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 13, color: '#1d4ed8', flexShrink: 0 }}>
                      {s.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.stop} · Class {s.class}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: s.boardStatus === 'Boarded' ? '#dcfce7' : '#fef9c3',
                      color: s.boardStatus === 'Boarded' ? '#16a34a' : '#d97706' }}>
                      {s.boardStatus}
                    </span>
                    <button onClick={() => notifyParent(s)}
                      title="Send location to parent"
                      style={{ padding: 5, borderRadius: 7, border: '1px solid #25D366',
                        background: '#f0fdf4', cursor: 'pointer', color: '#16a34a', display: 'flex' }}>
                      <MessageCircle size={12} />
                    </button>
                  </div>
                ))}
                {busStudents.length === 0 && (
                  <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>No students on this bus</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Students tab */}
      {tab === 'students' && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Student</th><th>Class</th><th>Bus</th><th>Route</th><th>Stop</th><th>Board Status</th><th>Notify Parent</th></tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const bus = buses.find(b => b._id === s.busId);
                  return (
                    <tr key={s._id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.admNo}</div>
                      </td>
                      <td>Class {s.class}</td>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{bus?.vehicleNumber || '—'}</td>
                      <td style={{ fontSize: 12 }}>{bus?.routeName || '—'}</td>
                      <td style={{ fontSize: 12 }}>{s.stop}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: s.boardStatus === 'Boarded' ? '#dcfce7' : '#fef9c3',
                          color: s.boardStatus === 'Boarded' ? '#16a34a' : '#d97706' }}>
                          {s.boardStatus}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => notifyParent(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                            borderRadius: 7, border: '1px solid #25D366', background: '#f0fdf4',
                            color: '#16a34a', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          <MessageCircle size={11} /> Send Location
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts tab */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>📣 Send Bus Location to Parents</div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>💬 Notify ALL Parents — with Live Location Link</div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>
                Sends current bus status, next stop, ETA and <b>Google Maps link</b> to all {students.length} parents
              </div>
              <button onClick={notifyAllParents}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
                  borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                <MessageCircle size={14} /> Send to All {students.length} Parents
              </button>
            </div>

            {/* Per bus */}
            {buses.map(bus => {
              const count = students.filter(s => s.busId === bus._id).length;
              const sc    = BUS_STATUS[bus.status] || BUS_STATUS['Off Duty'];
              return (
                <div key={bus._id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                  padding: 12, background: '#f8fafc', borderRadius: 10,
                  border: '1px solid #e2e8f0', marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>🚌</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{bus.vehicleNumber} — {bus.routeName}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      <span style={{ color: sc.color, fontWeight: 700 }}>{sc.emoji} {bus.status}</span>
                      &nbsp;· {count} students · Next: {bus.nextStop} ({bus.nextStopETA})
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const busStudents2 = students.filter(s => s.busId === bus._id && s.parentPhone);
                      busStudents2.forEach((s, i) => {
                        setTimeout(() => notifyParent(s), i * 800);
                      });
                      toast.success('Notifying ' + busStudents2.length + ' parents for ' + bus.vehicleNumber);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 7, border: '1px solid #25D366', background: '#f0fdf4',
                      color: '#16a34a', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                    <MessageCircle size={11} /> Notify ({count})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html:
        '@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }' +
        '@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }'
      }} />
    </div>
  );
}