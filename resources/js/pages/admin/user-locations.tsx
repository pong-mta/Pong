
import { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type UserLocation = {
    id: number;
    user_id: number;
    name: string;
    phone: string | null;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    recorded_at: string | null;
};

type Props = {
    locations: UserLocation[];
};

const markerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function FitMarkers({ locations }: { locations: UserLocation[] }) {
    const map = useMap();

    useEffect(() => {
        if (locations.length === 1) {
            map.setView(
                [locations[0].latitude, locations[0].longitude],
                15,
            );
        } else if (locations.length > 1) {
            map.fitBounds(
                locations.map(
                    (location) =>
                        [location.latitude, location.longitude] as [number, number],
                ),
                { padding: [35, 35], maxZoom: 15 },
            );
        }
    }, [locations, map]);

    return null;
}

function formatDate(value: string | null) {
    if (!value) return 'Unknown';
    return new Date(value).toLocaleString();
}

export default function UserLocationsPage({ locations }: Props) {
    useEffect(() => {
        const interval = window.setInterval(() => {
            router.reload({
                only: ['locations'],
                preserveState: true,
                preserveScroll: true,
            });
        }, 30000);

        return () => window.clearInterval(interval);
    }, []);

    const validLocations = locations.filter(
        (location) =>
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude) &&
            Math.abs(location.latitude) <= 90 &&
            Math.abs(location.longitude) <= 180,
    );

    return (
        <>
            <Head title="User Locations" />

            <div className="space-y-5 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">User Locations</h1>
                        <p className="text-sm text-muted-foreground">
                            Latest recorded GPS position for each user.
                        </p>
                    </div>

                    <div className="rounded-lg border px-4 py-2 text-sm">
                        Users with locations: <strong>{validLocations.length}</strong>
                    </div>
                </div>

                <div className="h-[65vh] min-h-[400px] overflow-hidden rounded-xl border">
                    <MapContainer
                        center={[12.8797, 121.774]}
                        zoom={6}
                        className="h-full w-full"
                        scrollWheelZoom
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <FitMarkers locations={validLocations} />

                        {validLocations.map((location) => (
                            <Marker
                                key={location.user_id}
                                position={[location.latitude, location.longitude]}
                                icon={markerIcon}
                            >
                                <Popup>
                                    <div className="space-y-1">
                                        <strong>{location.name}</strong>
                                        <div>Phone: {location.phone || 'Not available'}</div>
                                        <div>
                                            Accuracy:{' '}
                                            {location.accuracy !== null
                                                ? `${location.accuracy} m`
                                                : 'Unknown'}
                                        </div>
                                        <div>
                                            Last update: {formatDate(location.recorded_at)}
                                        </div>
                                        <a
                                            href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open map
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="p-3">User</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Coordinates</th>
                                <th className="p-3">Accuracy</th>
                                <th className="p-3">Last update</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validLocations.map((location) => (
                                <tr key={location.user_id} className="border-t">
                                    <td className="p-3 font-medium">{location.name}</td>
                                    <td className="p-3">{location.phone || '—'}</td>
                                    <td className="p-3">
                                        {location.latitude.toFixed(6)},{' '}
                                        {location.longitude.toFixed(6)}
                                    </td>
                                    <td className="p-3">
                                        {location.accuracy !== null
                                            ? `${location.accuracy} m`
                                            : '—'}
                                    </td>
                                    <td className="p-3">
                                        {formatDate(location.recorded_at)}
                                    </td>
                                </tr>
                            ))}

                            {validLocations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center">
                                        No user locations have been recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
