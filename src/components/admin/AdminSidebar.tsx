import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image,
  Tag,
  Users,
  ShieldCheck,
  ShoppingBag,
  Settings,
  BarChart3,
  Star,
  Bell,
  FileText,
  Megaphone,
  Gift,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Produtos', url: '/admin/products', icon: Package },
  { title: 'Categorias', url: '/admin/categories', icon: FolderTree },
  { title: 'Banners', url: '/admin/banners', icon: Image },
  { title: 'Encartes', url: '/admin/encartes', icon: Image },
  { title: 'Mensagens Rotativas', url: '/admin/rotating-messages', icon: Megaphone },
  { title: 'Cupons', url: '/admin/coupons', icon: Tag },
  { title: 'Cupons Pop-up', url: '/admin/popup-coupons', icon: Gift },
  { title: 'Pedidos', url: '/admin/orders', icon: ShoppingBag },
  { title: 'Avaliações', url: '/admin/reviews', icon: Star },
  { title: 'Dashboard de Avaliações', url: '/admin/reviews-dashboard', icon: BarChart3 },
  { title: 'Usuários', url: '/admin/users', icon: Users },
  { title: 'Cargos', url: '/admin/roles', icon: ShieldCheck },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Notificações', url: '/admin/system-notifications', icon: Bell },
  { title: 'Histórico de Ações', url: '/admin/audit-logs', icon: FileText },
  { title: 'Editar Rodapé', url: '/admin/site-settings', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  const isActive = (url: string, exact?: boolean) => {
    if (exact) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.exact}
                      className="hover:bg-accent hover:text-accent-foreground"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}