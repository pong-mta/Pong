import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/react';
import { Bell } from 'lucide-react';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
    unreadNotificationsCount?: number;
}

export function AppSidebarHeader({
    breadcrumbs = [],
    unreadNotificationsCount = 0,
}: AppSidebarHeaderProps) {
    const count = Math.max(0, unreadNotificationsCount);

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative shrink-0"
                aria-label={
                    count > 0
                        ? `Notifications, ${count} unread`
                        : 'Notifications'
                }
            >
                <Link href="/admin/notifications">
                    <Bell className="size-5" />

                    {count > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                </Link>
            </Button>
        </header>
    );
}
