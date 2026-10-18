
import { useEffect } from 'react';
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'User Locations',
        href: '/admin/user-locations',
    },
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
                {
                    padding: [35, 35],
                    maxZoom: 15,
                },
            );
        }
    }, [locations, map]);

    return null;
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Unknown';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return date.toLocaleString();
}

export default function UserLocationsPage({
    locations,
}: Props) {
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Locations" />

            <div className="flex h-full flex-1 flex-col gap-5 p-4 md:p-6">
                {/* Page heading */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            User Locations
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            View the latest recorded GPS position
                            of each mobile user.
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

                {/* GPS Map */}
                <section className="overflow-hidden rounded-xl border bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                        <div>
                            <h2 className="font-semibold">
                                Live GPS Map
                            </h2>

                            <p className="text-xs text-muted-foreground">
                                Map data refreshes every 30 seconds.
                            </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            GPS Tracking
                        </span>
                    </div>

                    <div className="h-[55vh] min-h-[400px] w-full">
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
                                    position={[
                                        location.latitude,
                                        location.longitude,
                                    ]}
                                    icon={markerIcon}
                                >
                                    <Popup>
                                        <div className="space-y-1">
                                            <strong>
                                                {location.name}
                                            </strong>

                                            <div>
                                                User ID: {location.user_id}
                                            </div>

                                            <div>
                                                Phone:{' '}
                                                {location.phone ||
                                                    'Not available'}
                                            </div>

                                            <div>
                                                Accuracy:{' '}
                                                {location.accuracy !== null
                                                    ? `${location.accuracy} m`
                                                    : 'Unknown'}
                                            </div>

                                            <div>
                                                Last update:{' '}
                                                {formatDate(
                                                    location.recorded_at,
                                                )}
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

                    {validLocations.length === 0 && (
                        <div className="border-t p-4 text-center text-sm text-muted-foreground">
                            No GPS locations have been recorded yet.
                        </div>
                    )}
                </section>

                {/* User locations table */}
                <section className="overflow-hidden rounded-xl border bg-background">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">
                            Recorded User Locations
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Latest location available for each user.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="whitespace-nowrap p-3">
                                        User
                                    </th>

                                    <th className="whitespace-nowrap p-3">
                                        Phone
                                    </th>

                                    <th className="whitespace-nowrap p-3">
                                        Latitude
                                    </th>

                                    <th className="whitespace-nowrap p-3">
                                        Longitude
                                    </th>

                                    <th className="whitespace-nowrap p-3">
                                        Accuracy
                                    </th>

                                    <th className="whitespace-nowrap p-3">
                                        Last Update
                                    </th>

                                    <th className="whitespace-nowrap p-3">
                                        Map
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {validLocations.map((location) => (
                                    <tr
                                        key={location.user_id}
                                        className="border-t transition-colors hover:bg-muted/30"
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
                                            {formatDate(
                                                location.recorded_at,
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap p-3">
                                            <a
                                                href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-primary underline-offset-4 hover:underline"
                                            >
                                                View
                                            </a>
                                        </td>
                                    </tr>
                                ))}

                                {validLocations.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            No user locations have been
                                            recorded yet.
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
