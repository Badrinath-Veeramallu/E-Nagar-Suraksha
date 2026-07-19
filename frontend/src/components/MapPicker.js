import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DraggableMarker = ({ position, onMove }) => {
    useMapEvents({
        click(e) { onMove(e.latlng); },
    });
    return position ? (
        <Marker
            position={position}
            draggable
            eventHandlers={{ dragend: (e) => onMove(e.target.getLatLng()) }}
        />
    ) : null;
};

const MapPicker = ({ onLocationSelect, initialLat, initialLng }) => {
    const [position, setPosition] = useState(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );
    const [geoLoading, setGeoLoading] = useState(false);
    const [address, setAddress] = useState('');

    const defaultCenter = [17.385, 78.4867]; // Hyderabad

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            return data.display_name || '';
        } catch { return ''; }
    };

    const handleMove = async (latlng) => {
        setPosition(latlng);
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        setAddress(addr);
        onLocationSelect({ lat: latlng.lat, lng: latlng.lng, address: addr });
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) return;
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const latlng = { lat: coords.latitude, lng: coords.longitude };
                setPosition(latlng);
                const addr = await reverseGeocode(latlng.lat, latlng.lng);
                setAddress(addr);
                onLocationSelect({ lat: latlng.lat, lng: latlng.lng, address: addr });
                setGeoLoading(false);
            },
            () => setGeoLoading(false)
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Pick Location on Map</label>
                <button type="button" onClick={getCurrentLocation} disabled={geoLoading}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 flex items-center gap-1">
                    {geoLoading ? '⏳ Locating...' : '📍 Use My Location'}
                </button>
            </div>

            <MapContainer
                center={position ? [position.lat, position.lng] : defaultCenter}
                zoom={13}
                style={{ height: '280px', width: '100%' }}
                className="rounded-lg border border-gray-300"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <DraggableMarker position={position} onMove={handleMove} />
            </MapContainer>

            {position && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                    <span className="font-medium">Coordinates:</span> {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                    {address && <><br /><span className="font-medium">Address:</span> {address.substring(0, 120)}</>}
                </div>
            )}

            {!position && (
                <p className="text-xs text-gray-400 text-center">Click on the map or use "My Location" to pin the complaint location</p>
            )}
        </div>
    );
};

export default MapPicker;
