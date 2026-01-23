import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { LayoutGrid, Contact, Columns3, CalendarDays, Handshake, Receipt, LineChart, Settings, LogOut, HelpCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';

const mainMenuItems = [{
  title: 'Dashboard',
  url: '/',
  icon: LayoutGrid
}, {
  title: 'Pipelines',
  url: '/pipelines',
  icon: Columns3
}, {
  title: 'Leads',
  url: '/leads',
  icon: Contact
}, {
  title: 'Agenda',
  url: '/agenda',
  icon: CalendarDays
}];

const salesItems = [{
  title: 'Oportunidades',
  url: '/deals',
  icon: Handshake
}, {
  title: 'Pedidos',
  url: '/orders',
  icon: Receipt
}];

const analyticsItems = [{
  title: 'Relatórios',
  url: '/reports',
  icon: LineChart
}];

const configItems = [{
  title: 'Configurações',
  url: '/settings',
  icon: Settings
}, {
  title: 'Segurança',
  url: '/security',
  icon: ShieldCheck
}];

const helpItems = [{
  title: 'Ajuda',
  url: '/help',
  icon: HelpCircle
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const {
    signOut,
    user
  } = useAuth();
  const {
    isAdmin,
    isModerator,
    loading: roleLoading
  } = useUserRole();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  // Show config items only for admins and moderators
  const canSeeConfig = isAdmin || isModerator;
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50';
  return <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
    <SidebarHeader className="border-b border-sidebar-border">
  <div className="flex items-center justify-center px-4 py-3">
    {/* Container que define formato horizontal e faz o crop */}
    <div className={`
        relative overflow-hidden rounded-md transition-all duration-200
        ${collapsed ? 'h-10 w-10' : 'h-16 w-full max-w-[220px]'}
        ${collapsed ? '' : 'aspect-[3.2/1]'}
      `}>
      <img src="/lovable-uploads/ae86e39e-a3e0-4d92-a994-0de0e09258ff.png" alt="Lúmen CRM" className="absolute inset-0 h-full w-full object-cover" />
    </div>
  </div>
    </SidebarHeader>


      <SidebarContent>
        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2.5 h-5 w-5" />
                      {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Comercial */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Comercial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2.5 h-5 w-5" />
                      {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Insights */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2.5 h-5 w-5" />
                      {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações - only for admins and moderators */}
        {canSeeConfig && <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Configurações</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {configItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="mr-2.5 h-5 w-5" />
                        {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {/* Ajuda */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {helpItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2.5 h-5 w-5" />
                      {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button variant="ghost" size={collapsed ? "icon" : "default"} onClick={signOut} className="w-full justify-start">
          <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-2.5'}`} />
          {!collapsed && <span className="font-medium text-sm">Sair</span>}
        </Button>
        {!collapsed && user && <div className="mt-2 text-xs text-muted-foreground truncate">
            {user.email}
          </div>}
        {!collapsed && <div className="mt-3 pt-3 border-t border-sidebar-border/40 flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/70 font-medium">
              Powered by
            </span>
            <span className="text-sm font-bold text-primary">
              Oceano Azul
            </span>
          </div>}
      </SidebarFooter>
    </Sidebar>;
}