import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Phone,
  List,
  Zap,
  Contact,
  Settings,
  Building2,
  ChevronDown,
  LogOut,
  CreditCard,
  Bot,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Atendimentos', icon: MessageSquare, path: '/tickets' },
  { label: 'Contatos', icon: Contact, path: '/contacts' },
  { label: 'Conexões', icon: Phone, path: '/connections' },
  { label: 'Filas', icon: List, path: '/queues' },
  { label: 'Mensagens Rápidas', icon: Zap, path: '/quick-messages' },
  { label: 'Membros', icon: Users, path: '/members' },
  { label: 'Configurações', icon: Settings, path: '/settings' },
];

const adminItems = [
  { label: 'Organizações', icon: Building2, path: '/admin/organizations' },
  { label: 'Planos', icon: CreditCard, path: '/admin/plans' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user, currentOrg, organizations, switchOrg, currentMembership } = useOrganization();
  const isGlobalAdmin = user?.role === 'admin';
  const isOrgAdmin = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} border-r border-sidebar-border`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg tracking-tight text-sidebar-primary">XamanoZap</span>}
        </div>
      </div>

      {/* Org Switcher */}
      {!collapsed && currentOrg && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
              <div className="w-7 h-7 rounded-md bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3.5 h-3.5 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{currentOrg.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 capitalize">{currentOrg.plan}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-sidebar-foreground/50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {organizations.map(org => (
                <DropdownMenuItem key={org.id} onClick={() => switchOrg(org.id)}>
                  <Building2 className="w-4 h-4 mr-2" />
                  {org.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/create-organization">
                  <Building2 className="w-4 h-4 mr-2" />
                  Nova Organização
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {collapsed && <div className="h-3" />}
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}

        {isGlobalAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">Admin</span>
              </div>
            )}
            {adminItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-sidebar-primary">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold truncate">{user?.full_name || 'Usuário'}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}