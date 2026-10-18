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
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardCheck,
    Folder,
    LayoutGrid,
    MapPinned,
    MessageSquareText,
    BellRing,
    Store,
} from 'lucide-react';
import AppLogo from './app-logo';

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
