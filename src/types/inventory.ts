export interface Product {
  id: string
  name: string
  description?: string
  sku: string
  category: string
  price: number
  cost: number
  unit: string
  barcode?: string
  supplierId?: string
  reorderLevel: number
  maxStock: number
  isActive: number // SQLite boolean as 0/1
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  paymentTerms?: string
  isActive: number // SQLite boolean as 0/1
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Inventory {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  lastUpdated: string
  userId: string
}

export interface StockMovement {
  id: string
  productId: string
  warehouseId: string
  movementType: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  referenceNumber?: string
  notes?: string
  createdAt: string
  userId: string
}

export interface Warehouse {
  id: string
  name: string
  location?: string
  isActive: number // SQLite boolean as 0/1
  createdAt: string
  userId: string
}

export interface DashboardStats {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  totalSuppliers: number
  recentMovements: StockMovement[]
  topProducts: Array<{
    product: Product
    inventory: Inventory
  }>
}

export interface Setting {
  id: string
  userId: string
  category: string
  settingKey: string
  settingValue: string
  settingType: 'text' | 'number' | 'boolean' | 'select'
  displayName: string
  description?: string
  options?: string
  isActive: number
  createdAt: string
  updatedAt: string
}