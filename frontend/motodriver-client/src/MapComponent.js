import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle clicks on the map (for simulation)
function LocationMarker({ onLocationSelect }) {
    const map = useMapEvents({
        click(e) {
            if (onLocationSelect) {
                onLocationSelect(e.latlng);
                map.flyTo(e.latlng, map.getZoom());
            }
        },
    });
    return null;
}

// Custom icons
const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png', // Mototaxi Icon Example
    iconSize: [40, 40],
});

const clientIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png', // User Icon Example
    iconSize: [35, 35],
});

export default function MapComponent({ center, markers = [], onLocationSelect, style }) {
    // Default center: Some city coord (e.g., Bogota or generic)
    const defaultCenter = [4.6097, -74.0817];

    return (
        <div style={style || { height: "400px", width: "100%" }}>
            <MapContainer center={center || defaultCenter} zoom={13} style={{ height: "100%", width: "100%", borderRadius: '15px' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker onLocationSelect={onLocationSelect} />

                {markers.map((marker, idx) => (
                    <Marker
                        key={idx}
                        position={[marker.lat, marker.lng]}
                        icon={marker.type === 'driver' ? driverIcon : clientIcon}
                    >
                        {marker.popup && <Popup>{marker.popup}</Popup>}
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
