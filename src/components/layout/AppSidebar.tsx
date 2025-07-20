import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { blink } from '@/blink/client'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Suppliers', href: '/suppliers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <div className={cn(
      'flex flex-col h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">Inventory Pro</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent',
                collapsed && 'px-2',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              onClick={() => navigate(item.href)}
            >
              <item.icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
              {!collapsed && item.name}
            </Button>
          )
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'px-2'
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn('w-5 h-5', !collapsed && 'mr-3')} />
          {!collapsed && 'Logout'}
        </Button>
      </div>
    </div>
  )
}