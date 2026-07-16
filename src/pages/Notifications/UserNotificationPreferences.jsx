import { useState, useEffect } from 'react'
import { Save, Settings, ShieldAlert, Check } from 'lucide-react'
import api from '../../services/api'

export default function UserNotificationPreferences() {
  const [preferences, setPreferences] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/notifications/preferences')
      if (res.data?.success) {
        setPreferences(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load user notification preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  const handleCheckboxChange = (configId, field) => {
    setPreferences(prev => prev.map(p => {
      if (p.configId === configId) {
        const updated = { ...p, [field]: !p[field] }
        
        // If muted is checked, disable popup/bell visually or lock them
        if (field === 'muted' && updated.muted) {
          updated.popupEnabled = false
          updated.bellEnabled = false
        } else if (field === 'muted' && !updated.muted) {
          updated.popupEnabled = true
          updated.bellEnabled = true
        }

        return updated
      }
      return p
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put('/api/notifications/preferences', { preferences })
      if (res.data?.success) {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { title: 'Settings Saved', message: 'Your notification preferences have been updated.', type: 'success' }
        }))
      }
    } catch (err) {
      console.error('Failed to save preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Settings size={20} className="text-[#0097A7]" />
            Notification Preferences
          </h1>
          <p className="text-[12px] text-slate-500 mt-1">Configure when and where you want to receive alerts and notifications.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-4 py-2 text-[12px] font-bold text-white bg-[#0097A7] hover:bg-[#00838F] rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 border border-slate-200 rounded-xl">Loading your preferences...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5 w-1/4">Module</th>
                  <th className="py-3 px-5 w-1/3">Event Description</th>
                  <th className="py-3 px-5 text-center">Popup</th>
                  <th className="py-3 px-5 text-center">Bell</th>
                  <th className="py-3 px-5 text-center">Email</th>
                  <th className="py-3 px-5 text-center">Mute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11.5px] text-slate-700">
                {preferences.map((p) => (
                  <tr key={p.configId} className={`hover:bg-slate-50/50 transition-colors ${p.muted ? 'bg-slate-50/20 text-slate-400' : ''}`}>
                    <td className="py-3.5 px-5 font-bold text-slate-800">{p.module}</td>
                    <td className="py-3.5 px-5 leading-normal">{p.description || p.event}</td>
                    
                    {/* Popup */}
                    <td className="py-3.5 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={p.popupEnabled}
                        disabled={p.muted}
                        onChange={() => handleCheckboxChange(p.configId, 'popupEnabled')}
                        className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] w-3.5 h-3.5 disabled:opacity-40"
                      />
                    </td>

                    {/* Bell */}
                    <td className="py-3.5 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={p.bellEnabled}
                        disabled={p.muted}
                        onChange={() => handleCheckboxChange(p.configId, 'bellEnabled')}
                        className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] w-3.5 h-3.5 disabled:opacity-40"
                      />
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={p.emailEnabled}
                        disabled={p.muted}
                        onChange={() => handleCheckboxChange(p.configId, 'emailEnabled')}
                        className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] w-3.5 h-3.5 disabled:opacity-40"
                      />
                      <span className="text-[8px] block text-slate-400 mt-0.5">Future</span>
                    </td>

                    {/* Mute */}
                    <td className="py-3.5 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={p.muted}
                        onChange={() => handleCheckboxChange(p.configId, 'muted')}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Warning */}
      <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 flex gap-3 text-amber-800 text-[11px] leading-relaxed">
        <ShieldAlert size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Mute Overrides:</span> Selecting <span className="font-semibold">Mute</span> will suppress all alerts (including desktop popups and navigation badges) for that specific category. SMS, WhatsApp, and Email integrations are tagged as "Future" and will become active once SMS/WhatsApp service gateways are configured in production.
        </div>
      </div>

    </div>
  )
}
