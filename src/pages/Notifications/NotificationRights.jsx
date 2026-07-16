import { useState, useEffect } from 'react'
import { Save, Shield, HelpCircle, Check, Square, Power } from 'lucide-react'
import api from '../../services/api'

export default function NotificationRights() {
  const [configs, setConfigs] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changedRights, setChangedRights] = useState({}) // key: configId_roleName -> boolean (enabled)
  const [globalEnabled, setGlobalEnabled] = useState(true)
  const [togglingGlobal, setTogglingGlobal] = useState(false)

  const fetchRightsMatrix = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/notifications/rights')
      if (res.data?.success) {
        const { configs: loadedConfigs, roles: loadedRoles } = res.data.data
        setConfigs(loadedConfigs)
        setRoles(loadedRoles)
      }
    } catch (err) {
      console.error('Failed to load rights matrix:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchGlobalSetting = async () => {
    try {
      const res = await api.get('/api/notifications/settings')
      if (res.data?.success) {
        setGlobalEnabled(res.data.data.globalNotificationsEnabled)
      }
    } catch (err) {
      console.error('Failed to fetch global settings:', err)
    }
  }

  const toggleGlobalSwitch = async () => {
    setTogglingGlobal(true)
    const nextState = !globalEnabled
    try {
      const res = await api.post('/api/notifications/settings', { globalNotificationsEnabled: nextState })
      if (res.data?.success) {
        setGlobalEnabled(nextState)
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { 
            title: nextState ? 'Engine Enabled' : 'Engine Disabled', 
            message: nextState ? 'Global notifications enabled successfully.' : 'Global notifications completely disabled.', 
            type: nextState ? 'success' : 'warning' 
          }
        }))
      }
    } catch (err) {
      console.error('Failed to toggle global switch:', err)
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { title: 'Operation Failed', message: 'Could not toggle global settings. Please try again.', type: 'error' }
      }))
    } finally {
      setTogglingGlobal(false)
    }
  }

  useEffect(() => {
    fetchRightsMatrix()
    fetchGlobalSetting()
  }, [])

  const isRoleEnabled = (config, role) => {
    const key = `${config.id}_${role.toUpperCase()}`
    if (changedRights[key] !== undefined) {
      return changedRights[key]
    }
    return config.rights?.some(r => r.role.toUpperCase() === role.toUpperCase()) || false
  }

  const handleCellClick = (configId, role) => {
    const roleUpper = role.toUpperCase()
    const key = `${configId}_${roleUpper}`
    
    // Find initial state
    const config = configs.find(c => c.id === configId)
    const initiallyEnabled = config?.rights?.some(r => r.role.toUpperCase() === roleUpper) || false
    const currentState = changedRights[key] !== undefined ? changedRights[key] : initiallyEnabled

    setChangedRights(prev => ({
      ...prev,
      [key]: !currentState
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const rightsPayload = Object.entries(changedRights).map(([key, enabled]) => {
        const [configId, role] = key.split('_')
        return {
          configId: parseInt(configId),
          role,
          enabled
        }
      })

      if (rightsPayload.length === 0) {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { title: 'No Changes', message: 'No notification rights changes found to save.', type: 'info' }
        }))
        setSaving(false)
        return
      }

      const res = await api.post('/api/notifications/rights', { rights: rightsPayload })
      if (res.data?.success) {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { title: 'Rights Updated', message: 'Notification rights updated successfully.', type: 'success' }
        }))
        setChangedRights({})
        fetchRightsMatrix()
      }
    } catch (err) {
      console.error('Failed to save rights:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Shield size={20} className="text-[#0097A7]" />
            Notification Rights Assignment
          </h1>
          <p className="text-[12px] text-slate-500 mt-1">Admin configuration utility to route alerts and events to specific user roles.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-4 py-2 text-[12px] font-bold text-white bg-[#0097A7] hover:bg-[#00838F] rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Global Notification Switch Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Power size={16} className={globalEnabled ? 'text-emerald-500' : 'text-slate-400'} />
            Global Notification Switch
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Completely enable or disable the Notification Engine across the entire ERP. Toggling this off stops all alert creation, real-time socket events, bell updates, popups, and email/SMS queues for all roles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${globalEnabled ? 'bg-emerald-550/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            {globalEnabled ? 'System Enabled' : 'System Muted'}
          </span>
          <button
            onClick={toggleGlobalSwitch}
            disabled={togglingGlobal}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${globalEnabled ? 'bg-[#0097A7]' : 'bg-slate-300'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${globalEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 border border-slate-200 rounded-xl">Loading configuration matrix...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-3.5 px-4 w-[180px] bg-slate-50">Module</th>
                  <th className="py-3.5 px-4 w-[280px] bg-slate-50">Event Type</th>
                  {roles.map(role => (
                    <th key={role} className="py-3.5 px-2 text-center text-[8.5px] font-extrabold rotate-0 max-w-[80px] truncate" title={role}>
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 bg-white sticky left-0 z-0">{config.module}</td>
                    <td className="py-3 px-4 border-r border-slate-100 bg-white">
                      <div>
                        <span className="font-semibold text-slate-900 block">{config.event}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">{config.description}</span>
                      </div>
                    </td>
                    
                    {roles.map(role => {
                      const enabled = isRoleEnabled(config, role)
                      return (
                        <td
                          key={role}
                          onClick={() => handleCellClick(config.id, role)}
                          className={`py-3 px-2 text-center cursor-pointer transition-colors ${enabled ? 'bg-[#0097A7]/5' : ''}`}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={enabled}
                              readOnly
                              className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] w-3.5 h-3.5 cursor-pointer pointer-events-none"
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Notes */}
      <div className="bg-blue-50 border border-blue-200/50 rounded-xl p-4 flex gap-3 text-blue-800 text-[11px] leading-relaxed">
        <HelpCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Administrative Guidance:</span> Select checkboxes in the matrix to route specific module actions/events to user roles. Active settings are applied instantly upon saving. Users matching these roles will receive real-time notifications on their navigation bar dropdown and desktop popup, unless they choose to mute alerts inside their personal preferences menu.
        </div>
      </div>

    </div>
  )
}
