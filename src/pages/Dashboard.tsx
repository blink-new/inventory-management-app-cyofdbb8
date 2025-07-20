import { useState, useEffect } from 'react'
import { Package, DollarSign, AlertTriangle, Users, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { blink } from '@/blink/client'
import type { DashboardStats, Product, Inventory, StockMovement } from '@/types/inventory'

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Get all products
      const products = await blink.db.products.list<Product>({
        where: { userId: user.id, isActive: 1 }
      })

      // Get all inventory
      const inventory = await blink.db.inventory.list<Inventory>({
        where: { userId: user.id }
      })

      // Get suppliers count
      const suppliers = await blink.db.suppliers.list({
        where: { userId: user.id, isActive: 1 }
      })

      // Get recent stock movements
      const recentMovements = await blink.db.stockMovements.list<StockMovement>({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 5
      })

      // Calculate stats
      const totalValue = products.reduce((sum, product) => {
        const inv = inventory.find(i => i.productId === product.id)
        return sum + (product.price * (inv?.quantity || 0))
      }, 0)

      const lowStockItems = products.filter(product => {
        const inv = inventory.find(i => i.productId === product.id)
        return (inv?.quantity || 0) <= product.reorderLevel
      }).length

      // Get top products by value
      const topProducts = products
        .map(product => {
          const inv = inventory.find(i => i.productId === product.id)
          return { product, inventory: inv }
        })
        .filter(item => item.inventory)
        .sort((a, b) => {
          const aValue = a.product.price * (a.inventory?.quantity || 0)
          const bValue = b.product.price * (b.inventory?.quantity || 0)
          return bValue - aValue
        })
        .slice(0, 5)

      setStats({
        totalProducts: products.length,
        totalValue,
        lowStockItems,
        totalSuppliers: suppliers.length,
        recentMovements,
        topProducts: topProducts as Array<{ product: Product; inventory: Inventory }>
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Active products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalValue.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats?.lowStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">Items below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">Active suppliers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Movements</CardTitle>
            <CardDescription>Latest inventory changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentMovements.length ? (
                stats.recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {movement.movementType === 'in' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {movement.movementType === 'in' ? 'Stock In' : 'Stock Out'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={movement.movementType === 'in' ? 'default' : 'secondary'}>
                      {movement.movementType === 'in' ? '+' : '-'}{movement.quantity}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent movements</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Value</CardTitle>
            <CardDescription>Highest value items in inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topProducts.length ? (
                stats.topProducts.map((item) => {
                  const value = item.product.price * item.inventory.quantity
                  return (
                    <div key={item.product.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.inventory.quantity} {item.product.unit} × ${item.product.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${value.toFixed(2)}</p>
                        <Badge 
                          variant={item.inventory.quantity <= item.product.reorderLevel ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {item.inventory.quantity <= item.product.reorderLevel ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No products found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => window.location.href = '/products'}>
              <Package className="w-4 h-4 mr-2" />
              Add Product
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/suppliers'}>
              <Users className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/inventory'}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Update Stock
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/reports'}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}