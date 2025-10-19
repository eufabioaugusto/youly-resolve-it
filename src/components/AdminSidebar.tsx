import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Shield,
  Package,
  Award,
  DollarSign,
  Wallet,
  Wrench,
  Banknote,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Visão Geral", icon: LayoutDashboard, section: "overview" },
  { title: "Usuários", icon: Shield, section: "users" },
  { title: "Gestão de Jobs", icon: Package, section: "jobs" },
  { title: "Ranking", icon: Award, section: "ranking" },
  { title: "Financeiro", icon: DollarSign, section: "financeiro" },
  { title: "Carteiras", icon: Wallet, section: "carteiras" },
  { title: "Saques", icon: Banknote, section: "saques" },
];

interface AdminSidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminSidebar({ currentSection, onSectionChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              {!isCollapsed && <span>Administração</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.section)}
                    className={
                      currentSection === item.section
                        ? "bg-muted text-primary font-medium"
                        : "hover:bg-muted/50"
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
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
