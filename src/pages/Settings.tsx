import { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw, Settings as SettingsIcon, Building, Package, DollarSign, Bell, Shield, Monitor } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'

interface Setting {
  id: string
  category: string
  settingKey: string
  settingValue: string
  settingType: string
  displayName: string
  description?: string
  options?: string[]
  isActive: number
}

const categoryIcons = {
  general: Building,
  inventory: Package,
  pricing: DollarSign,
  notifications: Bell,
  security: Shield,
  display: Monitor,
}

const categoryDescriptions = {
  general: 'Basic company and business information',
  inventory: 'Stock management and tracking preferences',
  pricing: 'Pricing rules and calculation settings',
  notifications: 'Alert and notification preferences',
  security: 'Security and access control settings',
  display: 'User interface and display options',
}

export function Settings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const { toast } = useToast()

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      
      // First try to get user-specific settings
      let userSettings = await blink.db.settings.list({
        where: { userId: user.id },
        orderBy: { category: 'asc' }
      })

      // If no user settings exist, copy from defaults
      if (userSettings.length === 0) {
        const defaultSettings = await blink.db.settings.list({
          where: { userId: 'default' },
          orderBy: { category: 'asc' }
        })

        // Create user-specific copies of default settings
        const userSettingsData = defaultSettings.map(setting => ({
          userId: user.id,
          category: setting.category,
          settingKey: setting.settingKey,
          settingValue: setting.settingValue,
          settingType: setting.settingType,
          displayName: setting.displayName,
          description: setting.description,
          options: setting.options,
          isActive: 1
        }))

        await blink.db.settings.createMany(userSettingsData)
        
        // Reload user settings
        userSettings = await blink.db.settings.list({
          where: { userId: user.id },
          orderBy: { category: 'asc' }
        })
      }

      // Parse options field for select types
      const parsedSettings = userSettings.map(setting => ({
        ...setting,
        options: setting.options ? JSON.parse(setting.options) : null
      }))

      setSettings(parsedSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const updateSetting = (settingKey: string, value: string) => {
    setSettings(prev => prev.map(setting => 
      setting.settingKey === settingKey 
        ? { ...setting, settingValue: value }
        : setting
    ))
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      
      // Update all settings in the database
      for (const setting of settings) {
        await blink.db.settings.update(setting.id, {
          settingValue: setting.settingValue,
          updatedAt: new Date().toISOString()
        })
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully!',
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    try {
      setSaving(true)
      const user = await blink.auth.me()
      
      // Delete current user settings
      for (const setting of settings) {
        await blink.db.settings.delete(setting.id)
      }
      
      // Reload from defaults
      await loadSettings()
      
      toast({
        title: 'Success',
        description: 'Settings reset to defaults successfully!',
      })
    } catch (error) {
      console.error('Failed to reset settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const renderSettingField = (setting: Setting) => {
    const { settingKey, settingValue, settingType, displayName, description, options } = setting

    switch (settingType) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={settingKey}>{displayName}</Label>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <Switch
              id={settingKey}
              checked={settingValue === 'true'}
              onCheckedChange={(checked) => updateSetting(settingKey, checked.toString())}
            />
          </div>
        )

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={settingKey}>{displayName}</Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Select value={settingValue} onValueChange={(value) => updateSetting(settingKey, value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={settingKey}>{displayName}</Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Input
              id={settingKey}
              type="number"
              value={settingValue}
              onChange={(e) => updateSetting(settingKey, e.target.value)}
              className="max-w-xs"
            />
          </div>
        )

      default: // text
        return (
          <div className="space-y-2">
            <Label htmlFor={settingKey}>{displayName}</Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Input
              id={settingKey}
              type="text"
              value={settingValue}
              onChange={(e) => updateSetting(settingKey, e.target.value)}
              className="max-w-md"
            />
          </div>
        )
    }
  }

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category)
  }

  const categories = [...new Set(settings.map(s => s.category))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your inventory system configuration and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons]
            const settingsCount = getSettingsByCategory(category).length
            
            return (
              <TabsTrigger
                key={category}
                value={category}
                className="flex items-center space-x-2"
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="capitalize">{category}</span>
                <Badge variant="secondary" className="ml-1">
                  {settingsCount}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map((category) => {
          const categorySettings = getSettingsByCategory(category)
          const Icon = categoryIcons[category as keyof typeof categoryIcons]
          const description = categoryDescriptions[category as keyof typeof categoryDescriptions]

          return (
            <TabsContent key={category} value={category} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {Icon && <Icon className="w-5 h-5" />}
                    <span className="capitalize">{category} Settings</span>
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categorySettings.map((setting, index) => (
                    <div key={setting.settingKey}>
                      {renderSettingField(setting)}
                      {index < categorySettings.length - 1 && <Separator className="my-6" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Settings Auto-Save</p>
              <p className="text-sm text-muted-foreground">
                Changes are saved to your account and will persist across sessions. 
                Use "Reset to Defaults" to restore original settings if needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}