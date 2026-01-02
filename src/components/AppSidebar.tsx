import { Shield, Crosshair, Terminal, FileText, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    title: 'Mission Control', 
    url: '/', 
    icon: Crosshair,
    description: 'Track hacking lifecycle' 
  },
  { 
    title: 'Terminal Lab', 
    url: '/terminal', 
    icon: Terminal,
    description: 'AI-powered log analysis' 
  },
  { 
    title: 'Report Vault', 
    url: '/reports', 
    icon: FileText,
    description: 'Generated reports database' 
  },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center terminal-glow">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gradient-cyber">HackerFlow</h1>
              <p className="text-xs text-muted-foreground">Security Workspace</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8", collapsed && "absolute -right-3 top-6 bg-sidebar border border-sidebar-border rounded-full")}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 group",
              collapsed && "justify-center px-2"
            )}
            activeClassName="bg-sidebar-accent text-primary border-l-2 border-primary terminal-glow"
          >
            <item.icon className="w-5 h-5 group-hover:text-primary transition-colors" />
            {!collapsed && (
              <div className="flex-1">
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="block text-xs text-muted-foreground">{item.description}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-muted-foreground">Operator</p>
            <p className="text-sm font-mono truncate text-foreground">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
