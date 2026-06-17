import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, Save, X, Camera, Send, CheckCircle2, User, Phone, MapPin, ClipboardList, RotateCcw, Search, Trash2, Mail, Map, Plus, ImageIcon, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { SpinnerLoader } from '../components/LocalLoader'


// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider whitespace-nowrap">
    {required && <span className="text-red-500 mr-1">*</span>}
    {children}
  </label>
)

const parseDateToInputFormat = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const monthName = parts[1].toLowerCase();
    const year = parts[2];
    
    const months = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    
    const month = months[monthName.substring(0, 3)];
    if (month && year && day) {
      return `${year}-${month}-${day}`;
    }
  }
  return '';
}

const getTodayDisplayDate = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = months[today.getMonth()];
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateToDisplayFormat = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) return dateStr;
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthNum = parts[1];
    const day = parseInt(parts[2], 10);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(monthNum, 10) - 1;
    const monthName = months[monthIndex];
    
    if (monthName && year && !isNaN(day)) {
      return `${String(day).padStart(2, '0')}-${monthName}-${year}`;
    }
  }
  return dateStr;
}

const parseDisplayDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthName = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[monthName.substring(0, 3)];
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const standardDate = new Date(dateStr);
  if (!isNaN(standardDate.getTime())) return standardDate;
  return new Date();
}

const getFinancialYear = (dateStr) => {
  const date = parseDisplayDate(dateStr)
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  const startYear = month >= 4 ? year : year - 1
  const endYear = startYear + 1
  const yy = String(startYear).slice(-2)
  const nextYY = String(endYear).slice(-2)
  return `${yy}-${nextYY}`
}

const FormRow = ({ label, required, children }) => (
  <div className="grid grid-cols-[165px_1fr] items-center gap-x-3 h-8 w-full">
    <div className="text-right flex items-center justify-end min-w-0 w-full">
      <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate select-none" title={label}>
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </label>
    </div>
    <div className="min-w-0">
      {children}
    </div>
  </div>
)

const DateInput = ({ value, onChange, className = "", ...props }) => {
  const inputValue = parseDateToInputFormat(value);
  
  const handleChange = (e) => {
    const yyyyMMdd = e.target.value;
    const displayValue = formatDateToDisplayFormat(yyyyMMdd);
    onChange({ target: { value: displayValue } });
  };
  
  return (
    <input
      type="date"
      value={inputValue}
      onChange={handleChange}
      className={`w-full h-8 px-3 text-[12px] border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm cursor-pointer ${className}`}
      {...props}
    />
  );
}

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "", ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full h-8 px-3 text-[12px] border border-slate-200 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-bold' : 'hover:border-slate-300'} shadow-sm ${className}`}
    {...props}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative group w-full ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full h-8 px-3 pr-8 text-[12px] border border-slate-200 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer shadow-sm"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value !== undefined ? o.value : o} value={o.value !== undefined ? o.value : o}>
          {o.label !== undefined ? o.label : o}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center group-hover:text-[#0097A7] transition-colors">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const TextArea = ({ placeholder, value, onChange, className = "", rows = 4 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full px-3 py-2 text-[12px] border border-slate-200 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 resize-none shadow-sm ${className}`}
  />
)

const StepTitle = ({ title, step }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <h3 className="text-[14px] font-black text-slate-800 tracking-tight">Step {step}</h3>
    {title && (
      <>
        <span className="text-slate-300 text-[12px] font-light">|</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      </>
    )}
    <div className="flex-1 h-[1px] bg-slate-100" />
  </div>
)

const ActionButton = ({ onClick, children, className = "", disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-1.5 bg-[#fff8e1] hover:bg-[#ffecb3] disabled:opacity-50 disabled:cursor-not-allowed text-[#f57c00] text-[11px] font-bold rounded border border-[#ffe082] transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ${className}`}
  >
    {children}
  </button>
)

export default function CustomerComplaintEntry() {
  const toast = useToast()
  const [images, setImages] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  
  // Masters state
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [employees, setEmployees] = useState([])
  
  // Loading states
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    id: '',
    ccNo: '',
    recDate: getTodayDisplayDate(),
    customerName: '',
    customerCode: '',
    complainantName: '',
    modelNo: '',
    siteAddress: '',
    whatsappLocation: '',
    // openingComplaint: '',
    serialNo: '',
    designation: '',
    mobileNo: '',
    alternateNo: '',
    emailId: '',
    complaintType: 'Fabrication Base',
    serviceType: 'BILL',
    workCompleteDate: getTodayDisplayDate(),
    complaintClosedDate: getTodayDisplayDate(),
    natureOfComplaint: '',
    actionThrough: '',
    attenderName: '',
    attenDate: getTodayDisplayDate(),
    finalDate: getTodayDisplayDate(),
    actionTaken: '',
    preventiveMeasure: '',
    feedbackSatisfaction: '',
    status: 'Open',
    vehicleCount: '',
    chooseOption: ''
  })

  // Load masters on mount
  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true)
      try {
        const [custRes, vehRes, empRes] = await Promise.all([
          api.get('/api/customer-master').catch(() => ({ data: { data: [] } })),
          api.get('/api/vehicle-master').catch(() => ({ data: { data: [] } })),
          api.get('/api/employee-master').catch(() => ({ data: { data: [] } }))
        ])
        setCustomers(custRes.data?.data || [])
        setVehicles(vehRes.data?.data || [])
        setEmployees(empRes.data?.data || [])
      } catch (err) {
        console.error('Failed to load masters:', err)
        toast.error('Failed to load masters data.')
      } finally {
        setLoading(false)
      }
    }
    loadMasters()
  }, [])

  // Generate CC code based on Date
  const fetchNextCcNo = async (dateStr) => {
    try {
      const fy = getFinancialYear(dateStr)
      const res = await api.get(`/api/customer-complaint/next-code?year=${fy}`)
      if (res.data?.success && res.data.nextCode) {
        setForm(f => ({ ...f, ccNo: res.data.nextCode }))
      }
    } catch (err) {
      console.error('Failed to fetch next CC number:', err)
    }
  }

  // Load edit row or generate next code
  useEffect(() => {
    const editId = localStorage.getItem('velson:complaint-edit')
    if (editId) {
      setLoading(true)
      api.get(`/api/customer-complaint/${editId}`)
        .then(res => {
          if (res.data?.success && res.data.data) {
            const found = res.data.data
            
            // Map DB structure to form
            setForm({
              ...found,
              chooseOption: '' // Reset option selection on load
            })

            if (found.images) {
              setImages(found.images.map(img => ({
                id: img.id,
                url: `/api/customer-complaint/image/${img.id}`,
                name: img.name
              })))
            }
          }
        })
        .catch(err => {
          console.error(err)
          toast.error('Failed to load complaint details.')
        })
        .finally(() => {
          setLoading(false)
        })
      localStorage.removeItem('velson:complaint-edit')
    } else {
      fetchNextCcNo(form.recDate)
    }
  }, [])

  // Get active customer object
  const activeCustomer = useMemo(() => {
    return customers.find(c => c.customerName === form.customerName || (c.cCode === form.customerCode && form.customerCode))
  }, [customers, form.customerName, form.customerCode])

  // Filtered customer vehicles
  const customerVehicles = useMemo(() => {
    if (!activeCustomer) return []
    return vehicles.filter(v => Number(v.customerId) === Number(activeCustomer.id))
  }, [vehicles, activeCustomer])

  const chooseOptions = useMemo(() => {
    return customerVehicles.map((v, i) => ({
      value: String(i + 1),
      label: `${v.modelName || ''} - ${v.serialNumber || 'No SN'}`
    }))
  }, [customerVehicles])

  const handleCustomerChange = (customerNameVal) => {
    const cust = customers.find(c => c.customerName === customerNameVal)
    if (!cust) {
      setForm(f => ({
        ...f,
        customerName: customerNameVal,
        customerCode: '',
        modelNo: '',
        serialNo: '',
        vehicleCount: '',
        chooseOption: ''
      }))
      return
    }

    setForm(f => ({
      ...f,
      customerName: customerNameVal,
      customerCode: cust.cCode || '',
      modelNo: '',
      serialNo: '',
      vehicleCount: '',
      chooseOption: ''
    }))
  }

  const handleCustomerCodeChange = (codeVal) => {
    const cust = customers.find(c => c.cCode === codeVal)
    if (!cust) {
      setForm(f => ({
        ...f,
        customerCode: codeVal,
        customerName: '',
        modelNo: '',
        serialNo: '',
        vehicleCount: '',
        chooseOption: ''
      }))
      return
    }

    setForm(f => ({
      ...f,
      customerCode: codeVal,
      customerName: cust.customerName || '',
      modelNo: '',
      serialNo: '',
      vehicleCount: '',
      chooseOption: ''
    }))
  }

  const handleChooseOptionChange = (optionVal) => {
    if (!optionVal) {
      setForm(f => ({
        ...f,
        chooseOption: '',
        modelNo: '',
        serialNo: '',
        vehicleCount: ''
      }))
      return
    }

    const index = parseInt(optionVal, 10) - 1
    const vehicle = customerVehicles[index]

    setForm(f => ({
      ...f,
      chooseOption: optionVal,
      modelNo: vehicle?.modelName || '',
      serialNo: vehicle?.serialNumber || '',
      vehicleCount: vehicle?.vehicleCount ? String(vehicle.vehicleCount) : '1'
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newImages = files.map(file => ({
      id: 'temp_' + Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file),
      name: file.name,
      file: file
    }))
    setImages(prev => [...prev, ...newImages])
    toast.success(`${files.length} Image(s) added successfully!`)
  }

  const handleRemoveImage = async (id, e) => {
    e.stopPropagation()
    if (typeof id === 'number') {
      try {
        await api.delete(`/api/customer-complaint/image/${id}`)
        toast.info("Image removed from database.")
      } catch (err) {
        console.error(err)
        toast.error("Failed to delete image from server.")
        return
      }
    } else {
      toast.info("Image removed.")
    }
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const [activeStep, setActiveStep] = useState(1)

  const STEPS = [
    { number: 1, title: 'Registration', subtitle: 'Complaint Registration' },
    { number: 2, title: 'Investigation', subtitle: 'Complaint Investigation' },
    { number: 3, title: 'Corrective Action', subtitle: 'Corrective Action Taken' },
    { number: 4, title: 'Preventive Measures', subtitle: 'Preventive Measures' },
    { number: 5, title: 'Feedback & Closure', subtitle: 'Customer Feedback & Closure' },
  ]

  const isStepCompleted = (stepNum) => {
    if (stepNum === 1) return !!form.customerName || !!form.customerCode
    if (stepNum === 2) return !!form.natureOfComplaint || !!form.actionThrough
    if (stepNum === 3) return !!form.actionTaken || !!form.attenderName
    if (stepNum === 4) return !!form.preventiveMeasure
    if (stepNum === 5) return !!form.feedbackSatisfaction
    return false
  }

  const u = k => e => {
    const val = e.target.value
    setForm(f => ({ ...f, [k]: val }))
    if (k === 'recDate' && !form.id) {
      fetchNextCcNo(val)
    }
  }

  // Upload new temp images
  const uploadNewImages = async (complaintId) => {
    const newImages = images.filter(img => typeof img.id !== 'number' && img.file)
    if (newImages.length === 0) return

    const formData = new FormData()
    newImages.forEach(img => {
      formData.append('images', img.file)
    })

    try {
      const res = await api.post(`/api/customer-complaint/${complaintId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (res.data?.success && res.data.data) {
        const saved = res.data.data.map(img => ({
          id: img.id,
          url: `/api/customer-complaint/image/${img.id}`,
          name: img.name
        }))
        setImages(prev => [
          ...prev.filter(img => typeof img.id === 'number'),
          ...saved
        ])
      }
    } catch (err) {
      console.error('Failed to upload images:', err)
      toast.error('Failed to upload some images.')
    }
  }

  const handleStepSave = async (step) => {
    if (!form.customerName || !form.customerName.trim()) {
      toast.warning('Please select or enter Customer Name first.')
      return
    }

    setLoading(true)
    try {
      let savedRecord
      if (form.id) {
        const res = await api.put(`/api/customer-complaint/${form.id}`, form)
        savedRecord = res.data.data
        toast.success(`Step ${step} Data Saved Successfully!`)
      } else {
        const res = await api.post('/api/customer-complaint', form)
        savedRecord = res.data.data
        setForm(prev => ({ ...prev, id: savedRecord.id }))
        toast.success(`Complaint registered successfully!`)
      }

      if (savedRecord && savedRecord.id) {
        await uploadNewImages(savedRecord.id)
      }

      if (step < 5) {
        setActiveStep(step + 1)
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || `Failed to save Step ${step} data.`)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestApproval = async () => {
    if (!form.customerName || !form.customerName.trim()) {
      toast.warning('Please select or enter Customer Name first.')
      return
    }

    setLoading(true)
    try {
      const updatedForm = { ...form, status: 'Closed' }
      let savedRecord
      if (form.id) {
        const res = await api.put(`/api/customer-complaint/${form.id}`, updatedForm)
        savedRecord = res.data.data
        toast.success(`Complaint closed and request submitted successfully!`)
      } else {
        const res = await api.post('/api/customer-complaint', updatedForm)
        savedRecord = res.data.data
        setForm(prev => ({ ...prev, id: savedRecord.id }))
        toast.success(`Complaint registered and closed successfully!`)
      }

      setForm(updatedForm)

      if (savedRecord && savedRecord.id) {
        await uploadNewImages(savedRecord.id)
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || `Failed to submit request for approval.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#e0f7fa] min-h-[calc(100vh-46px)] pb-6 flex flex-col relative">
      {/* Centralized Fullscreen Loader Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <SpinnerLoader size={30} message="Loading Data..." />
        </div>
      )}

      {/* Top Header Bar */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-700 rounded-sm" />
          <h1 className="text-[12px] font-bold text-slate-700">Customer Complaint Entry</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Vehicle Count :</span>
            <span className="text-[11px] font-bold text-slate-700">{form.vehicleCount || '-'}</span>
          </div>
          <button onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'CCMSEntryDetails' } }))} className="bg-rose-500 text-white p-1 rounded hover:bg-rose-600 transition-colors shadow">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 w-full flex-1 flex flex-col gap-4">
        {/* Premium Wizard Stepper */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="relative flex justify-between items-center w-full">
            {/* Background progress line */}
            <div className="absolute top-[18px] left-[10%] right-[10%] h-[3px] bg-slate-100 rounded-full z-0">
              <div
                className="h-full bg-[#0097A7] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((activeStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {STEPS.map((s) => {
              const isCompleted = isStepCompleted(s.number)
              const isActive = activeStep === s.number
              const isPast = s.number < activeStep

              return (
                <button
                  key={s.number}
                  onClick={() => setActiveStep(s.number)}
                  className="flex-1 relative z-10 flex flex-col items-center group focus:outline-none text-center"
                >
                  {/* Solid white mask to block progress line behind the bubble and its active ring */}
                  <div className="absolute top-[18px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full z-0" />

                  {/* Step Bubble */}
                  <div className={`
                    relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] 
                    transition-all duration-300 shadow-sm border-2
                    ${isActive
                      ? 'bg-[#0097A7] text-white border-[#0097A7] ring-4 ring-[#e0f7fa] scale-110'
                      : isCompleted || isPast
                        ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                    }
                  `}>
                    {isCompleted || isPast ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span>{s.number}</span>
                    )}
                  </div>

                  {/* Labels */}
                  <span className={`
                    relative z-10 mt-1.5 text-[10.5px] font-bold tracking-tight transition-colors duration-200
                    ${isActive ? 'text-[#0097A7]' : 'text-slate-500 group-hover:text-slate-700'}
                  `}>
                    {s.title}
                  </span>
                  <span className="relative z-10 text-[8.5px] text-slate-400 font-semibold hidden md:inline">
                    {isActive ? 'In Progress' : isCompleted || isPast ? 'Completed' : 'Pending'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Wizard step content with transition */}
        <div key={activeStep} className="step-transition flex-1 flex flex-col">
          {activeStep === 1 && (
            <div className="bg-[#f0f9ff] border border-sky-100 rounded-lg p-6 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <StepTitle step="1" title="Complaint Registration" />
                
                <div className="grid grid-cols-12 gap-8 items-stretch mt-4">
                  {/* Left Column - Customer Details */}
                  <div className="col-span-4 flex flex-col gap-3">
                    <FormRow label="CC No :">
                      <Input value={form.ccNo} readOnly className="!bg-slate-50 font-bold text-[#0097A7] text-center" />
                    </FormRow>
                    <FormRow label="Customer Name :">
                      <Select
                        options={customers.map(c => c.customerName)}
                        placeholder="Select Customer..."
                        value={form.customerName}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                      />
                    </FormRow>
                    <FormRow label="Customer Code :">
                      <Select
                        options={customers.map(c => c.cCode).filter(Boolean)}
                        placeholder="Select Code..."
                        value={form.customerCode}
                        onChange={(e) => handleCustomerCodeChange(e.target.value)}
                      />
                    </FormRow>
                    <FormRow label="Complainant Name :">
                      <Input value={form.complainantName} onChange={u('complainantName')} />
                    </FormRow>
                    <FormRow label="Choose Vehicle :">
                      <Select
                        options={chooseOptions}
                        placeholder={form.customerName ? "Select Customer Vehicle..." : "Select Customer First"}
                        value={form.chooseOption}
                        onChange={(e) => handleChooseOptionChange(e.target.value)}
                      />
                    </FormRow>
                    <FormRow label="Model No :">
                      <Input value={form.modelNo} onChange={u('modelNo')} />
                    </FormRow>
                    <FormRow label="Site Address :">
                      <Input value={form.siteAddress} onChange={u('siteAddress')} />
                    </FormRow>
                    <FormRow label="Whatsapp Location :">
                      <Input value={form.whatsappLocation} onChange={u('whatsappLocation')} />
                    </FormRow>
                  </div>

                  {/* Middle Column - Complaint Details */}
                  <div className="col-span-4 flex flex-col gap-3 border-r border-slate-200/60 pr-8">
                    <FormRow label="Complaint Rec.Date :">
                      <DateInput
                        value={form.recDate}
                        onChange={u('recDate')}
                      />
                    </FormRow>
                    {/* <FormRow label="Opening Complaint :"> */}
                      {/* <Select
                        options={['New', 'Repetitive']}
                        placeholder=""
                        value={form.openingComplaint}
                        onChange={u('openingComplaint')}
                      />
                    </FormRow> */}
                    <FormRow label="Serial No :">
                      <Input value={form.serialNo} onChange={u('serialNo')} />
                    </FormRow>
                    <FormRow label="Designation :">
                      <Input value={form.designation} onChange={u('designation')} />
                    </FormRow>
                    <FormRow label="Mobile No :">
                      <Input value={form.mobileNo} onChange={u('mobileNo')} />
                    </FormRow>
                    <FormRow label="Alternate No :">
                      <Input value={form.alternateNo} onChange={u('alternateNo')} />
                    </FormRow>
                    <FormRow label="Email Id :">
                      <Input value={form.emailId} onChange={u('emailId')} />
                    </FormRow>
                    <FormRow label="Vehicle Count :">
                      <Input value={form.vehicleCount} onChange={u('vehicleCount')} />
                    </FormRow>
                  </div>

                  {/* Right Column - Status & Images */}
                  <div className="col-span-4 flex flex-col gap-3">
                    <FormRow label="Complaint Status :">
                      <span className="text-[12px] font-extrabold text-rose-600 tracking-wider">
                        {form.status}
                      </span>
                    </FormRow>
                    
                    <FormRow label="Service Type :">
                      <Select
                        options={['BILL', 'WARRANTY']}
                        value={form.serviceType}
                        onChange={u('serviceType')}
                        placeholder=""
                      />
                    </FormRow>
                    
                    <FormRow label="Complaint Closed Date :">
                      <DateInput
                        value={form.complaintClosedDate}
                        onChange={u('complaintClosedDate')}
                      />
                    </FormRow>

                    {/* Images Section Header - Aligned with Row 4 */}
                    <div className="flex items-center h-8">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Images
                      </label>
                    </div>

                    {/* Image Upload/List - Fills the height of Rows 5-8 */}
                    {images.length === 0 ? (
                      <label className="flex-1 w-full min-h-[140px] border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-[#0097A7] rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer transition-all duration-200 shadow-sm group">
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <ImageIcon size={30} className="text-slate-300 group-hover:text-[#0097A7] transition-colors mb-1.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#0097A7] transition-colors">
                          Click to Upload Images
                        </span>
                      </label>
                    ) : (
                      <div className="flex-1 w-full min-h-[140px] border border-slate-200 bg-white rounded-lg p-3 shadow-sm flex flex-col justify-start">
                        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[160px] pr-1">
                          {images.map((img) => (
                            <div
                              key={img.id}
                              className="group relative aspect-video border border-slate-200 bg-slate-50 rounded overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                              onClick={() => setPreviewImage(img.url)}
                            >
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1.5">
                                <button
                                  onClick={(e) => handleRemoveImage(img.id, e)}
                                  className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow transition-transform hover:scale-110"
                                  title="Remove Image"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          ))}
                          <label className="aspect-video border border-dashed border-slate-300 bg-white hover:bg-slate-50 hover:border-[#0097A7] rounded flex flex-col items-center justify-center text-slate-400 cursor-pointer transition-all duration-200 shadow-sm group">
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <Plus size={16} className="group-hover:scale-110 transition-transform text-[#0097A7]" />
                            <span className="text-[8px] font-bold uppercase mt-0.5">Add More</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Section */}
              <div className="mt-8 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Complaint Type :
                  </label>
                  <div className="flex items-center gap-6">
                    {['Fabrication Base', 'Functional Base', 'Minor Leakage', 'Electrical'].map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer group select-none">
                        <input
                          type="radio"
                          checked={form.complaintType === t}
                          onChange={() => setForm((f) => ({ ...f, complaintType: t }))}
                          className="w-3.5 h-3.5 accent-[#0097A7] cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                          {t}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStepSave(1)}
                    disabled={loading}
                    className="h-8 px-4 bg-[#0097A7] hover:bg-[#00838F] text-white text-[11px] font-bold rounded shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Save size={13} />
                    Save Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="bg-[#f0f9ff] border border-sky-100 rounded-lg p-4 shadow-sm flex-1 flex flex-col">
              <StepTitle step="2" title="Complaint Investigation" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 mb-4">
                <div className="space-y-1 flex flex-col">
                  <Label>Nature of Complaint :</Label>
                  <TextArea value={form.natureOfComplaint} onChange={u('natureOfComplaint')} className="flex-1 min-h-[150px]" />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label>Action Through :</Label>
                  <TextArea value={form.actionThrough} onChange={u('actionThrough')} className="flex-1 min-h-[150px]" />
                </div>
              </div>
              <div className="flex justify-end mt-auto pt-4 border-t border-slate-100/50">
                <ActionButton onClick={() => handleStepSave(2)} disabled={loading}>
                  Step 2 Save
                </ActionButton>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="bg-[#f0f9ff] border border-sky-100 rounded-lg p-6 shadow-sm flex-1 flex flex-col">
              <StepTitle step="3" title="Corrective Action Taken" />
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                  <div className="flex-1 space-y-1 w-full">
                    <Label>Attender Name :</Label>
                    <Select
                      options={employees.map(e => e.empName)}
                      value={form.attenderName}
                      onChange={u('attenderName')}
                      placeholder="Select Attender..."
                    />
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    <Label>Atten Date :</Label>
                    <DateInput value={form.attenDate} onChange={u('attenDate')} />
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    <Label>Final Date :</Label>
                    <DateInput value={form.finalDate} onChange={u('finalDate')} />
                  </div>
                </div>
                <div className="space-y-1 flex-1 flex flex-col">
                  <Label>Action Taken :</Label>
                  <TextArea value={form.actionTaken} onChange={u('actionTaken')} className="flex-1 min-h-[150px]" />
                </div>
                <div className="flex justify-end mt-auto pt-4 border-t border-slate-100/50">
                  <ActionButton onClick={() => handleStepSave(3)} disabled={loading}>
                    Step 3 Save
                  </ActionButton>
                </div>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="bg-[#f0f9ff] border border-sky-100 rounded-lg p-6 shadow-sm flex-1 flex flex-col">
              <StepTitle step="4" title="Preventive Measures" />
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1 flex-1 flex flex-col">
                  <Label>What Measure Built to Avoid Same Complaint :</Label>
                  <TextArea value={form.preventiveMeasure} onChange={u('preventiveMeasure')} className="flex-1 min-h-[150px]" />
                </div>
                <div className="flex justify-end mt-auto pt-4 border-t border-slate-100/50">
                  <ActionButton onClick={() => handleStepSave(4)} disabled={loading}>
                    Step 4 Save
                  </ActionButton>
                </div>
              </div>
            </div>
          )}

          {activeStep === 5 && (
            <div className="bg-[#f0f9ff] border border-sky-100 rounded-lg p-6 shadow-sm flex-1 flex flex-col">
              <StepTitle step="5" title="Customer Feedback & Closure" />
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1 flex-1 flex flex-col">
                  <Label>Customer Feed Back Satisfaction :</Label>
                  <TextArea value={form.feedbackSatisfaction} onChange={u('feedbackSatisfaction')} className="flex-1 min-h-[150px]" />
                </div>
                 <div className="flex justify-end mt-auto pt-4 border-t border-slate-100/50">
                  <ActionButton 
                    onClick={handleRequestApproval}
                    disabled={loading}
                    className="!bg-[#e8f5e9] !text-[#2e7d32] !border-[#a5d6a7]"
                  >
                    Request for Approval
                  </ActionButton>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        <div className="bg-white rounded-lg border border-slate-200 px-5 py-3 shadow-sm flex items-center justify-between">
          <button
            disabled={activeStep === 1}
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-[#0097A7] hover:border-[#0097A7] disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 rounded text-[11px] font-bold transition-all shadow-sm active:scale-95 bg-white"
          >
            ← Previous Step
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 mr-2">
              Step {activeStep} of 5
            </span>
            {activeStep < 5 ? (
              <button
                onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
                className="px-4 py-2 border border-[#0097A7] text-[#0097A7] hover:bg-[#0097A7]/10 rounded text-[11px] font-bold transition-all shadow-sm active:scale-95 bg-white"
              >
                Skip to Next →
              </button>
            ) : (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'CCMSEntryDetails' } }))}
                className="px-4 py-2 bg-[#e0f7fa] text-[#0097A7] hover:bg-[#b2ebf2] rounded text-[11px] font-bold transition-all shadow-sm active:scale-95"
              >
                View All Entries
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-white rounded-lg p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"
            >
              <X size={16} />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded" />
          </div>
        </div>
      )}
    </div>
  )
}