
import { useCallback, useEffect, useState } from 'react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardCheck,
    Folder,
    LayoutGrid,
    MapPinned,
    MessageSquareText,
    BellRing,
    Store,
    CheckCheck,
    ExternalLink,
} from 'lucide-react';
import AppLogo from './app-logo';

type AdminNotification = {
    id: string;
    data: {
        title?: string;
        message?: string;
        business_name?: string;
        application_id?: number;
        url?: string;
    };
    read_at: string | null;
    created_at: string;
};

type NotificationResponse = {
    notifications: AdminNotification[];
    unread_count: number;
};

const userNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/admin/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Applications',
        url: '/admin/applications',
        icon: ClipboardCheck,
    },
    {
        title: 'All Stores',
        url: '/admin/stores',
        icon: Store,
    },
    {
        title: 'User Locations',
        url: '/admin/user-locations',
        icon: MapPinned,
    },
    {
        title: 'SMS Messages',
        url: '/admin/sms-messages',
        icon: MessageSquareText,
    },
    {
        title: 'FCM Notifications',
        url: '/admin/fcm-notifications',
        icon: BellRing,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        url: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        url: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

function getCookie(name: string): string | null {
    const prefix = `${name}=`;
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith(prefix));

    if (!cookie) return null;

    const value = cookie.slice(prefix.length);

    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function getCsrfHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    // Prefer Laravel's XSRF cookie when available.
    const xsrfToken = getCookie('XSRF-TOKEN');

    if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
    } else {
        // Fallback to the CSRF meta tag.
        const csrfToken = document.querySelector<HTMLMetaElement>(
            'meta[name="csrf-token"]',
        )?.content;

        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
        }
    }

    return headers;
}

export function AppSidebar() {
    const { url } = usePage();
    const isAdminArea = url.startsWith('/admin');
    const navItems = isAdminArea ? adminNavItems : userNavItems;
    const homeUrl = isAdminArea ? '/admin/dashboard' : '/dashboard';

    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(
        null,
    );

    const loadNotifications = useCallback(async () => {
        if (!isAdminArea) return;

        try {
            setLoadingNotifications(true);
            setNotificationError(null);

            const response = await fetch('/admin/notifications', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Unable to load notifications (${response.status}).`,
                );
            }

            const result: NotificationResponse = await response.json();

            setNotifications(result.notifications ?? []);
            setUnreadCount(result.unread_count ?? 0);
        } catch (error) {
            console.error('Failed to load admin notifications:', error);
            setNotificationError('Could not load notifications.');
        } finally {
            setLoadingNotifications(false);
        }
    }, [isAdminArea]);

    useEffect(() => {
        if (!isAdminArea) return;

        void loadNotifications();

        const interval = window.setInterval(() => {
            void loadNotifications();
        }, 30000);

        return () => window.clearInterval(interval);
    }, [isAdminArea, loadNotifications]);

    const markAsRead = async (notification: AdminNotification) => {
        if (!notification.read_at) {
            try {
                const response = await fetch(
                    `/admin/notifications/${encodeURIComponent(notification.id)}/read`,
                    {
                        method: 'PATCH',
                        credentials: 'same-origin',
                        headers: getCsrfHeaders(),
                    },
                );

                if (!response.ok) {
                    const message = await response.text();

                    console.error(
                        'Mark as read failed:',
                        response.status,
                        message,
                    );

                    setNotificationError(
                        response.status === 419
                            ? 'Your session security token expired. Refresh the page and try again.'
                            : `Could not mark as read (${response.status}).`,
                    );

                    return;
                }

                const result: { success: boolean; unread_count: number } =
                    await response.json();

                setNotifications((current) =>
                    current.map((item) =>
                        item.id === notification.id
                            ? {
                                  ...item,
                                  read_at: new Date().toISOString(),
                              }
                            : item,
                    ),
                );

                setUnreadCount(result.unread_count);
                setNotificationError(null);
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
                setNotificationError('Could not mark notification as read.');
                return;
            }
        }

        setNotificationsOpen(false);
        router.visit(notification.data.url || '/admin/applications');
    };

    const markAllAsRead = async () => {
        try {
            setNotificationError(null);

            const response = await fetch('/admin/notifications/read-all', {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: getCsrfHeaders(),
            });

            if (!response.ok) {
                const message = await response.text();

                console.error(
                    'Mark all as read failed:',
                    response.status,
                    message,
                );

                setNotificationError(
                    response.status === 419
                        ? 'Your session security token expired. Refresh the page and try again.'
                        : `Could not mark all as read (${response.status}).`,
                );

                return;
            }

            await response.json();

            const now = new Date().toISOString();

            setNotifications((current) =>
                current.map((item) => ({
                    ...item,
                    read_at: item.read_at ?? now,
                })),
            );

            setUnreadCount(0);
            setNotificationError(null);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            setNotificationError('Could not mark all notifications as read.');
        }
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {isAdminArea && (
                    <div className="px-2 pt-2">
                        <button
                            type="button"
                            onClick={() =>
                                setNotificationsOpen((open) => !open)
                            }
                            className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-sidebar-accent"
                            aria-expanded={notificationsOpen}
                            aria-label={`Admin notifications, ${unreadCount} unread`}
                        >
                            <span className="relative">
                                <BellRing className="size-4" />

                                {unreadCount > 0 && (
                                    <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </span>

                            <span className="flex-1">Notifications</span>

                            {unreadCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {unreadCount} unread
                                </span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="mt-2 overflow-hidden rounded-lg border bg-background shadow-sm">
                                <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                                    <span className="text-sm font-semibold">
                                        Notifications
                                    </span>

                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => void markAllAsRead()}
                                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                                        >
                                            <CheckCheck className="size-3" />
                                            Read all
                                        </button>
                                    )}
                                </div>

                                {notificationError && (
                                    <p
                                        role="alert"
                                        className="border-b px-3 py-2 text-xs text-destructive"
                                    >
                                        {notificationError}
                                    </p>
                                )}

                                <div className="max-h-80 overflow-y-auto">
                                    {loadingNotifications &&
                                        notifications.length === 0 && (
                                            <p className="px-3 py-4 text-sm text-muted-foreground">
                                                Loading notifications...
                                            </p>
                                        )}

                                    {!loadingNotifications &&
                                        notifications.length === 0 && (
                                            <p className="px-3 py-4 text-sm text-muted-foreground">
                                                No notifications yet.
                                            </p>
                                        )}

                                    {notifications.map((notification) => (
                                        <button
                                            type="button"
                                            key={notification.id}
                                            onClick={() =>
                                                void markAsRead(notification)
                                            }
                                            className={`block w-full border-b px-3 py-3 text-left last:border-b-0 hover:bg-muted ${
                                                !notification.read_at
                                                    ? 'bg-muted/50'
                                                    : ''
                                            }`}
                                        >
                                            <span className="flex items-start gap-2">
                                                {!notification.read_at && (
                                                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-600" />
                                                )}

                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium">
                                                        {notification.data.title ??
                                                            'New notification'}
                                                    </span>

                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        {notification.data.message ??
                                                            notification.data.business_name ??
                                                            'Open to view details.'}
                                                    </span>

                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        {new Date(
                                                            notification.created_at,
                                                        ).toLocaleString()}
                                                    </span>
                                                </span>

                                                <ExternalLink className="mt-1 size-3 shrink-0 text-muted-foreground" />
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <Link
                                    href="/admin/applications"
                                    onClick={() => setNotificationsOpen(false)}
                                    className="block border-t px-3 py-2 text-center text-xs font-medium text-primary hover:bg-muted"
                                >
                                    View applications
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter
                    items={footerNavItems}
                    className="mt-auto"
                />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
