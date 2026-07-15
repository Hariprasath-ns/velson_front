---
name: velson-coding-standards
description: >
  Use this skill whenever creating a NEW .jsx file in the Velson frontend project
  (src/pages/ or src/components/). This skill defines the mandatory structure,
  imports, data fetching pattern, and conventions every new file must follow.
  Trigger whenever the user says "create a new page", "add a new component",
  "make a new form", or any task that results in writing a new .jsx file in this project.
---

# Velson Frontend — New File Coding Standards

Every new `.jsx` file in this project MUST follow these rules exactly.
Do not deviate unless the user explicitly overrides a rule.

---

## 1. Mandatory imports (use only what's needed)

```js
// Routing
import { useNavigate, useLocation } from 'react-router-dom'

// Icons — always from lucide-react
import { ChevronRight, Save, Trash2, X, Plus } from 'lucide-react'

// Toast notifications — ALWAYS this import, never react-hot-toast or others
import { useToast } from '../components/Toast'

// API — ALWAYS this, never raw axios or fetch
import api from '../services/api'

// React Query shared hooks — import only what this file uses
import { useCustomers, useVehicles, useReferenceMaster } from '../hooks/useMasterData'

// Search input for item selection — use instead of loading 10k records
import ItemSearchInput from '../components/ItemSearchInput'
```

---

## 2. Data fetching rules

### Master / shared data → React Query hooks (NEVER useEffect)

| Data needed | Hook to use |
|---|---|
| Customer list | `const { data: customers = [] } = useCustomers()` |
| Vehicle list | `const { data: vehicles = [] } = useVehicles()` |
| Service spares | `const { data: serviceSpares = [] } = useServiceSpares()` |
| Service bookings | `const { data: bookingEntries = [] } = useServiceBookings()` |
| Material issues | `const { data: materialIssues = [] } = useMaterialIssues()` |
| Tax master | `const { data: taxMaster = [] } = useTaxMaster()` |
| Item groups | `const { data: itemGroups = [] } = useItemGroups()` |
| BOM list | `const { data: bomList = [] } = useBoms()` |
| Employees | `const { data: employees = [] } = useEmployees()` |
| Reference data | `const { data: vehicleTypes = [] } = useReferenceMaster('Vehicle_Type')` |

### Item name input → ItemSearchInput (NEVER load limit=10000)

```jsx
// NEVER do this:
const [itemMaster, setItemMaster] = useState([])
useEffect(() => { api.get('/api/item-master?limit=10000').then(...) }, [])

// ALWAYS do this instead:
<ItemSearchInput
  value={row.itemName}
  onChange={(item) => {
    handleRowChange(index, 'itemName', item.partName)
    handleRowChange(index, 'barcode', item.partNo)
    handleRowChange(index, 'uom', item.uom || 'NOS')
    handleRowChange(index, 'rate', String(item.rate || '0.00'))
  }}
/>
```

### Page-specific data → useEffect is fine

```js
useEffect(() => {
  // OK: next reference number
  api.get('/api/xyz/next-ref').then(...)

  // OK: edit mode fetch with dynamic ID
  if (editId) api.get(`/api/xyz/${editId}`).then(...)
}, [editId])
```

### Never put shared master data inside useEffect
If you find yourself writing `api.get('/api/customer-master')` inside a `useEffect`, stop — use `useCustomers()` instead.

---

## 3. Page file structure (follow this order)

```jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ... } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useCustomers, ... } from '../hooks/useMasterData'
import ItemSearchInput from '../components/ItemSearchInput'

// 1. Small reusable UI primitives (Label, Input, Select) — define at top of file
const Label = ({ children, required }) => (...)
const Input = ({ ... }) => (...)
const Select = ({ ... }) => (...)

// 2. Main component — always default export
export default function PageName() {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // 3. React Query hooks for shared data
  const { data: customers = [] } = useCustomers()

  // 4. useState for form state and page-specific data only
  const [form, setForm] = useState({ ... })
  const [rows, setRows] = useState([{ ... }])

  // 5. useEffect only for page-specific fetches
  useEffect(() => {
    // next-ref, edit mode fetch, etc.
  }, [])

  // 6. Handlers
  const handleInputChange = (field, val) => { ... }
  const handleSave = async () => { ... }

  // 7. Return JSX
  return (
    <div className="h-[calc(100vh-46px)] w-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      {/* Top header bar */}
      {/* Scrollable content */}
      {/* Fixed bottom action bar */}
    </div>
  )
}
```

---

## 4. UI conventions

### Page layout — always this 3-part structure:
```jsx
<div className="h-[calc(100vh-46px)] w-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
  {/* 1. Fixed top header */}
  <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Section</span>
      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
      <span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Page Title</span>
    </div>
  </div>

  {/* 2. Scrollable content */}
  <div className="flex-1 overflow-y-auto p-5 space-y-4">
    ...
  </div>

  {/* 3. Fixed bottom action bar */}
  <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-[0_-3px_12px_rgba(0,0,0,0.04)] z-10">
    ...
  </div>
</div>
```

### Buttons:
```jsx
// Primary action
<button className="flex items-center gap-1.5 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded shadow transition-all active:scale-95">
  <Save size={15} /> Save
</button>

// Danger action
<button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[13px] font-bold rounded transition-colors shadow-sm active:scale-95">
  <Trash2 size={15} /> Delete
</button>

// Close / Cancel
<button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded text-[12px] transition-colors shadow-sm">
  <X size={14} /> Close
</button>
```

### Brand color: `#0097A7` (teal) — use for focus rings, primary buttons, accents

### Label component (always use for form labels):
```jsx
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}{children}
  </label>
)
```

---

## 5. Toast notifications

```js
const toast = useToast()

toast.success('Saved successfully!')
toast.error('Something went wrong!')

// Always show error from API response like this:
toast.error(err.response?.data?.message || 'Failed to save')
```

---

## 6. Save handler pattern

```js
const handleSave = async () => {
  // 1. Validate required fields first
  if (!form.fieldName.trim()) {
    toast.error('Field is required!')
    return
  }

  // 2. Build payload
  const payload = { ...form, items: rows }

  // 3. POST or PUT based on edit mode
  try {
    if (editId) {
      await api.put(`/api/endpoint/${editId}`, payload)
      toast.success('Updated successfully!')
    } else {
      await api.post('/api/endpoint', payload)
      toast.success('Saved successfully!')
    }
    setTimeout(() => navigate('/target-route'), 1000)
  } catch (err) {
    console.error(err)
    toast.error(err.response?.data?.message || 'Failed to save')
  }
}
```

---

## 7. What to NEVER do in a new file

- ❌ `import axios from 'axios'` — always use `api` from `../services/api`
- ❌ `api.get('/api/customer-master')` inside `useEffect` — use `useCustomers()`
- ❌ `api.get('/api/item-master?limit=10000')` — use `ItemSearchInput`
- ❌ `import { toast } from 'react-hot-toast'` — use `useToast()`
- ❌ Inline styles (`style={{}}`) — always Tailwind classes
- ❌ Different color values — always use `#0097A7` for brand color