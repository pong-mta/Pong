
import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, X } from 'lucide-react';

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'User Locations', href: '/admin/user-locations' },
];

const markerIcon = new L.Icon({
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const selectedMarkerIcon = new L.Icon({
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [35, 57],
    iconAnchor: [17, 57],
    popupAnchor: [1, -48],
    shadowSize: [57, 57],
});

function FitMarkers({
    locations,
}: {
    locations: UserLocation[];
}) {
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
                        [
                            location.latitude,
                            location.longitude,
                        ] as [number, number],
                ),
                { padding: [35, 35], maxZoom: 15 },
            );
        }
    }, [locations, map]);

    return null;
}

function MapController({
    mapRef,
}: {
    mapRef: React.MutableRefObject<LeafletMap | null>;
}) {
    const map = useMap();

    useEffect(() => {
        mapRef.current = map;

        return () => {
            mapRef.current = null;
        };
    }, [map, mapRef]);

    return null;
}

function formatDate(value: string | null): string {
    if (!value) return 'Unknown';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Unknown'
        : date.toLocaleString();
}

export default function UserLocationsPage({
    locations,
}: Props) {
    const [search, setSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markerRefs = useRef<Record<number, L.Marker | null>>({});

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

    const validLocations = useMemo(
        () =>
            locations.filter(
                (location) =>
                    Number.isFinite(location.latitude) &&
                    Number.isFinite(location.longitude) &&
                    Math.abs(location.latitude) <= 90 &&
                    Math.abs(location.longitude) <= 180,
            ),
        [locations],
    );

    const filteredLocations = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return validLocations;

        return validLocations.filter((location) =>
            [
                location.name,
                location.phone ?? '',
                String(location.user_id),
            ].some((value) => value.toLowerCase().includes(term)),
        );
    }, [search, validLocations]);

    function selectLocation(location: UserLocation) {
        setSelectedUserId(location.user_id);

        mapRef.current?.flyTo(
            [location.latitude, location.longitude],
            17,
            { duration: 0.8 },
        );

        window.setTimeout(() => {
            markerRefs.current[location.user_id]?.openPopup();
        }, 850);
    }

    function clearSearch() {
        setSearch('');
        setSelectedUserId(null);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Locations" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            User Locations
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Search for a user and locate their latest GPS position.
                        </p>
                    </div>

                    <div className="rounded-lg border bg-background px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Users with locations
                        </p>
                        <p className="text-2xl font-bold">
                            {validLocations.length}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <section className="rounded-xl border bg-background p-4">
                    <label
                        htmlFor="user-location-search"
                        className="mb-2 block text-sm font-medium"
                    >
                        Search users
                    </label>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />

                            <input
                                id="user-location-search"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by name, phone, or user ID..."
                                className="h-11 w-full rounded-lg border bg-background pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X size={17} />
                                </button>
                            )}
                        </div>
                    </div>

                    {search.trim() && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {filteredLocations.length} matching user
                            {filteredLocations.length === 1 ? '' : 's'}.
                            Select a result below to zoom to their marker.
                        </p>
                    )}

                    {search.trim() && filteredLocations.length > 0 && (
                        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border">
                            {filteredLocations.map((location) => (
                                <button
                                    key={location.user_id}
                                    type="button"
                                    onClick={() => selectLocation(location)}
                                    className={`flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-muted/50 ${
                                        selectedUserId === location.user_id
                                            ? 'bg-primary/10 ring-1 ring-inset ring-primary/30'
                                            : ''
                                    }`}
                                >
                                    <MapPin
                                        size={19}
                                        className={
                                            selectedUserId === location.user_id
                                                ? 'shrink-0 text-primary'
                                                : 'shrink-0 text-muted-foreground'
                                        }
                                    />

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">
                                            {location.name}
                                        </span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {location.phone || 'No phone'} · ID{' '}
                                            {location.user_id}
                                        </span>
                                    </span>

                                    <span className="text-xs text-primary">
                                        Locate
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Map */}
                <section className="overflow-hidden rounded-xl border bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                        <div>
                            <h2 className="font-semibold">GPS Map</h2>
                            <p className="text-xs text-muted-foreground">
                                Locations refresh every 30 seconds.
                            </p>
                        </div>

                        {selectedUserId !== null && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedUserId(null);
                                    mapRef.current?.closePopup();
                                }}
                                className="text-sm text-primary hover:underline"
                            >
                                Clear selection
                            </button>
                        )}
                    </div>

                    <div className="h-[55vh] min-h-[400px] w-full">
                        <MapContainer
                            center={[12.8797, 121.774]}
                            zoom={6}
                            className="h-full w-full"
                            scrollWheelZoom
                        >
                            <MapController mapRef={mapRef} />

                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <FitMarkers locations={validLocations} />

                            {validLocations.map((location) => (
                                <Marker
                                    key={location.user_id}
                                    ref={(marker) => {
                                        markerRefs.current[location.user_id] =
                                            marker;
                                    }}
                                    position={[
                                        location.latitude,
                                        location.longitude,
                                    ]}
                                    icon={
                                        selectedUserId === location.user_id
                                            ? selectedMarkerIcon
                                            : markerIcon
                                    }
                                    zIndexOffset={
                                        selectedUserId === location.user_id
                                            ? 1000
                                            : 0
                                    }
                                    eventHandlers={{
                                        click: () =>
                                            setSelectedUserId(location.user_id),
                                    }}
                                >
                                    <Popup>
                                        <div className="space-y-1">
                                            <strong>{location.name}</strong>
                                            <div>User ID: {location.user_id}</div>
                                            <div>
                                                Phone:{' '}
                                                {location.phone || 'Not available'}
                                            </div>
                                            <div>
                                                Accuracy:{' '}
                                                {location.accuracy !== null
                                                    ? `${location.accuracy} m`
                                                    : 'Unknown'}
                                            </div>
                                            <div>
                                                Last update:{' '}
                                                {formatDate(location.recorded_at)}
                                            </div>
                                            <a
                                                href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open in OpenStreetMap
                                            </a>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </section>

                {/* Results table */}
                <section className="overflow-hidden rounded-xl border bg-background">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">User Location Results</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {search.trim()
                                ? 'Showing users matching your search.'
                                : 'Showing all recorded user locations.'}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="whitespace-nowrap p-3">User</th>
                                    <th className="whitespace-nowrap p-3">Phone</th>
                                    <th className="whitespace-nowrap p-3">Latitude</th>
                                    <th className="whitespace-nowrap p-3">Longitude</th>
                                    <th className="whitespace-nowrap p-3">Accuracy</th>
                                    <th className="whitespace-nowrap p-3">Last Update</th>
                                    <th className="whitespace-nowrap p-3">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredLocations.map((location) => (
                                    <tr
                                        key={location.user_id}
                                        className={`border-t transition-colors hover:bg-muted/30 ${
                                            selectedUserId === location.user_id
                                                ? 'bg-primary/10'
                                                : ''
                                        }`}
                                    >
                                        <td className="whitespace-nowrap p-3 font-medium">
                                            {location.name}
                                        </td>
                                        <td className="whitespace-nowrap p-3">
                                            {location.phone || '—'}
                                        </td>
                                        <td className="whitespace-nowrap p-3 font-mono text-xs">
                                            {location.latitude.toFixed(6)}
                                        </td>
                                        <td className="whitespace-nowrap p-3 font-mono text-xs">
                                            {location.longitude.toFixed(6)}
                                        </td>
                                        <td className="whitespace-nowrap p-3">
                                            {location.accuracy !== null
                                                ? `${location.accuracy} m`
                                                : '—'}
                                        </td>
                                        <td className="whitespace-nowrap p-3">
                                            {formatDate(location.recorded_at)}
                                        </td>
                                        <td className="whitespace-nowrap p-3">
                                            <button
                                                type="button"
                                                onClick={() => selectLocation(location)}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                Locate
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredLocations.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            {search.trim()
                                                ? 'No users match your search.'
                                                : 'No user locations have been recorded yet.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
