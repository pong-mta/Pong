import { useEffect, useState } from 'react';
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

export function AppSidebar() {
    const { url } = usePage();
    const isAdminArea = url.startsWith('/admin');
    const navItems = isAdminArea ? adminNavItems : userNavItems;
    const homeUrl = isAdminArea ? '/admin/dashboard' : '/dashboard';

    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const loadNotifications = async () => {
        if (!isAdminArea) return;

        try {
            setLoadingNotifications(true);

            const response = await fetch('/admin/notifications', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Unable to load notifications.');
            }

            const result: NotificationResponse = await response.json();

            setNotifications(result.notifications ?? []);
            setUnreadCount(result.unread_count ?? 0);
        } catch (error) {
            console.error('Failed to load admin notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        if (!isAdminArea) return;

        void loadNotifications();

        const interval = window.setInterval(() => {
            void loadNotifications();
        }, 30000);

        return () => window.clearInterval(interval);
    }, [isAdminArea]);

    const markAsRead = async (notification: AdminNotification) => {
        if (!notification.read_at) {
            try {
                const csrfToken = document
                    .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                    ?.content;

                const response = await fetch(
                    `/admin/notifications/${notification.id}/read`,
                    {
                        method: 'PATCH',
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            ...(csrfToken
                                ? { 'X-CSRF-TOKEN': csrfToken }
                                : {}),
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error('Unable to mark notification as read.');
                }

                await loadNotifications();
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        setNotificationsOpen(false);
        router.visit(notification.data.url || '/admin/applications');
    };

    const markAllAsRead = async () => {
        try {
            const csrfToken = document
                .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content;

            const response = await fetch('/admin/notifications/read-all', {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken
                        ? { 'X-CSRF-TOKEN': csrfToken }
                        : {}),
                },
            });

            if (!response.ok) {
                throw new Error('Unable to mark notifications as read.');
            }

            await loadNotifications();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
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
