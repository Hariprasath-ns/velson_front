import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../services/api'
import { X, Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { TableSkeleton } from '../components/LocalLoader'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

const PAGE_SIZES = [5, 10, 25, 50]

const COUNTRY_CODES = [
  { code: 'IN', dial: '+91', name: 'India' },
  { code: 'US', dial: '+1', name: 'United States' },
  { code: 'GB', dial: '+44', name: 'United Kingdom' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'AU', dial: '+61', name: 'Australia' },
  { code: 'DE', dial: '+49', name: 'Germany' },
  { code: 'FR', dial: '+33', name: 'France' },
  { code: 'IT', dial: '+39', name: 'Italy' },
  { code: 'ES', dial: '+34', name: 'Spain' },
  { code: 'CN', dial: '+86', name: 'China' },
  { code: 'JP', dial: '+81', name: 'Japan' },
  { code: 'SG', dial: '+65', name: 'Singapore' },
  { code: 'MY', dial: '+60', name: 'Malaysia' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia' },
  { code: 'ZA', dial: '+27', name: 'South Africa' },
  { code: 'NZ', dial: '+64', name: 'New Zealand' },
  { code: 'LK', dial: '+94', name: 'Sri Lanka' },
  { code: 'BD', dial: '+880', name: 'Bangladesh' },
  { code: 'NP', dial: '+977', name: 'Nepal' },
  { code: 'PK', dial: '+92', name: 'Pakistan' }
]

const getDialCodeFromCountry = (countryName) => {
  if (!countryName) return null
  const name = countryName.trim().toLowerCase()
  const match = COUNTRY_CODES.find(cc => 
    cc.name.toLowerCase() === name || 
    cc.code.toLowerCase() === name ||
    (name === 'ind' && cc.code === 'IN') ||
    (name === 'usa' && cc.code === 'US') ||
    (name === 'uk' && cc.code === 'GB') ||
    (name === 'uae' && cc.code === 'AE')
  )
  return match ? match.dial : null
}

const parsePhone = (value) => {
  if (!value) return { code: '+91', number: '' }
  const cleanValue = value.trim()
  const matched = COUNTRY_CODES.find(cc => cleanValue.startsWith(cc.dial))
  if (matched) {
    return {
      code: matched.dial,
      number: cleanValue.slice(matched.dial.length).trim()
    }
  }
  return { code: '+91', number: cleanValue }  
}

const validatePhoneHelper = (number, dialCode, label = 'number') => {
  if (!number || !number.trim()) return ''
  const matched = COUNTRY_CODES.find(cc => cc.dial === dialCode)
  if (matched) {
    if (matched.code === 'IN') {
      const regex = /^[6-9]\d{9}$/
      if (!regex.test(number.trim())) {
        return `Invalid ${label} (must be 10 digits)`
      }
    } else {
      try {
        const phoneNumber = parsePhoneNumberFromString(number, matched.code)
        if (!phoneNumber || !phoneNumber.isValid()) {
          return `Invalid ${label}`
        }
      } catch {
        if (!/^\d{7,15}$/.test(number.trim())) {
          return `Invalid ${label}`
        }
      }
    }
  }
  return ''
}

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
]

const STATE_CODES = {
  'Andhra Pradesh':'AP','Arunachal Pradesh':'AR','Assam':'AS','Bihar':'BR',
  'Chhattisgarh':'CG','Goa':'GA','Gujarat':'GJ','Haryana':'HR','Himachal Pradesh':'HP',
  'Jharkhand':'JH','Karnataka':'KA','Kerala':'KL','Madhya Pradesh':'MP','Maharashtra':'MH',
  'Manipur':'MN','Meghalaya':'ML','Mizoram':'MZ','Nagaland':'NL','Odisha':'OD','Punjab':'PB',
  'Rajasthan':'RJ','Sikkim':'SK','Tamil Nadu':'TN','Telangana':'TS','Tripura':'TR',
  'Uttar Pradesh':'UP','Uttarakhand':'UK','West Bengal':'WB',
  'Andaman & Nicobar Islands':'AN','Chandigarh':'CH',
  'Dadra & Nagar Haveli and Daman & Diu':'DD','Delhi':'DL',
  'Jammu & Kashmir':'JK','Ladakh':'LA','Lakshadweep':'LD','Puducherry':'PY',
}

const STATE_CITIES = {
  'Tamil Nadu':['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Erode','Tiruppur','Vellore','Thoothukudi','Tirunelveli','Dindigul','Namakkal','Karur','Tiruchengode','Thanjavur','Kumbakonam','Hosur','Kancheepuram','Ambattur','Avadi','Perundurai','Sivakasi','Rajapalayam'],
  'Karnataka':['Bengaluru','Mysuru','Hubli','Mangaluru','Belagavi','Tumkur','Shivamogga','Davangere','Ballari','Kalaburagi','Vijayapura','Raichur','Hassan','Udupi','Kolar','Hosapete','Bidar'],
  'Maharashtra':['Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur','Kolhapur','Amravati','Nanded','Sangli','Jalgaon','Akola','Latur','Dhule','Ahmednagar','Chandrapur'],
  'Gujarat':['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Gandhinagar','Junagadh','Anand','Morbi','Mehsana','Surendranagar','Bharuch','Navsari','Vapi'],
  'Uttar Pradesh':['Lucknow','Kanpur','Agra','Varanasi','Meerut','Prayagraj','Ghaziabad','Noida','Aligarh','Moradabad','Saharanpur','Gorakhpur','Bareilly','Firozabad','Mathura'],
  'Rajasthan':['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara','Alwar','Sikar','Pali','Tonk','Sri Ganganagar','Barmer','Chittorgarh'],
  'West Bengal':['Kolkata','Asansol','Siliguri','Durgapur','Bardhaman','Malda','Barasat','Krishnanagar','Howrah','Haldia','Kharagpur'],
  'Andhra Pradesh':['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Kadapa','Rajahmundry','Tirupati','Kakinada','Anantapur','Vizianagaram'],
  'Telangana':['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Ramagundam','Mahbubnagar','Nalgonda','Adilabad','Suryapet','Siddipet'],
  'Kerala':['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Alappuzha','Malappuram','Kannur','Kasaragod','Kottayam'],
  'Madhya Pradesh':['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Ratlam','Rewa','Singrauli','Chhindwara','Burhanpur'],
  'Bihar':['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Bihar Sharif','Arrah','Begusarai','Katihar','Munger'],
  'Odisha':['Bhubaneswar','Cuttack','Rourkela','Brahmapur','Sambalpur','Puri','Balasore','Bhadrak','Baripada','Jharsuguda'],
  'Punjab':['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Hoshiarpur','Mohali','Firozpur','Pathankot','Moga'],
  'Haryana':['Faridabad','Gurugram','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat','Panchkula','Bhiwani'],
  'Delhi':['New Delhi','Dwarka','Rohini','Pitampura','Laxmi Nagar','Janakpuri','Saket','Connaught Place','Karol Bagh','Preet Vihar','Mayur Vihar'],
  'Chhattisgarh':['Raipur','Bhilai','Bilaspur','Korba','Durg','Rajnandgaon','Jagdalpur','Ambikapur'],
  'Jharkhand':['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribagh','Giridih','Dumka'],
  'Assam':['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur','Karimganj'],
  'Himachal Pradesh':['Shimla','Dharamsala','Solan','Mandi','Kullu','Hamirpur','Una','Baddi'],
  'Uttarakhand':['Dehradun','Haridwar','Rishikesh','Roorkee','Haldwani','Kashipur','Rudrapur','Nainital'],
  'Goa':['Panaji','Margao','Vasco da Gama','Mapusa','Ponda','Calangute'],
  'Jammu & Kashmir':['Srinagar','Jammu','Anantnag','Baramulla','Sopore','Udhampur','Kathua'],
  'Ladakh':['Leh','Kargil'],
  'Manipur':['Imphal','Thoubal','Bishnupur','Churachandpur'],
  'Meghalaya':['Shillong','Tura','Jowai','Nongpoh'],
  'Arunachal Pradesh':['Itanagar','Naharlagun','Pasighat','Bomdila'],
  'Nagaland':['Kohima','Dimapur','Mokokchung','Tuensang'],
  'Mizoram':['Aizawl','Lunglei','Saiha','Champhai'],
  'Tripura':['Agartala','Udaipur','Dharmanagar','Belonia'],
  'Sikkim':['Gangtok','Namchi','Mangan','Gyalshing'],
  'Puducherry':['Puducherry','Karaikal','Mahe','Yanam'],
  'Chandigarh':['Chandigarh'],
  'Andaman & Nicobar Islands':['Port Blair'],
  'Lakshadweep':['Kavaratti'],
  'Dadra & Nagar Haveli and Daman & Diu':['Daman','Diu','Silvassa'],
}

const INDIA_BANKS = [
  'State Bank of India','Punjab National Bank','Bank of Baroda','Canara Bank',
  'Union Bank of India','Bank of India','Indian Bank','Central Bank of India',
  'Indian Overseas Bank','UCO Bank','Bank of Maharashtra','Punjab & Sind Bank',
  'HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank','IndusInd Bank',
  'Yes Bank','IDFC FIRST Bank','Federal Bank','South Indian Bank','Karur Vysya Bank',
  'City Union Bank','Tamilnad Mercantile Bank','Catholic Syrian Bank','Dhanlaxmi Bank',
  'Karnataka Bank','Jammu & Kashmir Bank','Bandhan Bank','RBL Bank','DCB Bank',
  'AU Small Finance Bank','Equitas Small Finance Bank','Ujjivan Small Finance Bank',
  'ESAF Small Finance Bank','Suryoday Small Finance Bank','Jana Small Finance Bank',
  'Airtel Payments Bank','India Post Payments Bank','Fino Payments Bank',
  'Tamil Nadu Grama Bank','Karnataka Vikas Grameena Bank','Saraswat Bank','Cosmos Bank',
]

const BANK_BRANCHES = {
  'State Bank of India':['Tiruchengode','Coimbatore Main','Chennai Anna Salai','Salem Main','Erode','Namakkal','Bengaluru MG Road','Mumbai Fort','Delhi Main'],
  'HDFC Bank':['Coimbatore','Chennai Anna Nagar','Salem','Bengaluru Koramangala','Mumbai Fort','Delhi Connaught Place'],
  'ICICI Bank':['Coimbatore','Chennai Anna Salai','Salem','Bengaluru','Mumbai','Delhi'],
  'Axis Bank':['Coimbatore','Chennai','Bengaluru','Mumbai','Delhi'],
  'Canara Bank':['Coimbatore','Chennai','Salem','Bengaluru','Mumbai','Delhi'],
  'Indian Bank':['Tiruchengode','Coimbatore','Chennai Rajaji Salai','Salem','Namakkal'],
  'Karur Vysya Bank':['Tiruchengode','Karur Main','Coimbatore','Chennai','Salem','Erode','Namakkal'],
  'City Union Bank':['Kumbakonam Main','Chennai','Coimbatore','Salem','Erode','Namakkal','Tiruchengode'],
}

// ── SearchableSelect ────────────────────────────────────────────────────────

function SearchableSelect({ value, onChange, options = [], placeholder = 'Search...', disabled = false, className = '' }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = options
    .filter(o => o.toLowerCase().includes((query || '').toLowerCase()))
    .slice(0, 60)

  return (
    <div ref={ref} className="relative flex-1">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full min-w-[180px] bg-white border border-slate-300 rounded shadow-lg max-h-52 overflow-y-auto mt-0.5">
          {filtered.map(opt => (
            <div
              key={opt}
              onMouseDown={() => { onChange(opt); setQuery(opt); setOpen(false) }}
              className={`px-3 py-1.5 text-[12px] cursor-pointer transition-colors ${opt === value ? 'bg-[#0097A7] text-white' : 'hover:bg-[#0097A7]/10 text-slate-700'}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Detail Modal ────────────────────────────────────────────────────────────

function DetailModal({ row, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Supplier Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-1.5 max-h-[70vh] overflow-y-auto">
          {[
            ['Supplier Type', row.supplierType],
            ['Supplier Code', row.sCode],
            ['Supplier Name', row.supplierName],
            ['GST No', row.gstNo],
            ['City', row.city],
            ['State', row.state],
            ['State Code', row.stateCode],
            ['Pin Code', row.pinCode],
            ['Contact Person', row.contactPerson],
            ['Mobile', row.mobile ? `${row.mobileCode ? `${row.mobileCode} ` : ''}${row.mobile}` : '—'],
            ['Phone', row.phone ? `${row.phoneCode ? `${row.phoneCode} ` : ''}${row.phone}` : '—'],
            ['Email', row.email],
            ['Bank Name', row.bankName],
            ['Branch Name', row.branchName],
            ['Account Name', row.accountName],
            ['Account Number', row.accountNumber],
            ['IFSC Code', row.ifscCode],
            ['MICR Code', row.micrCode],
          ].map(([l, v]) => (
            <div key={l} className="flex flex-col py-1 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{l}</span>
              <span className="text-[13px] text-slate-800 font-medium">{v || '—'}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-lg transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Empty form ──────────────────────────────────────────────────────────────

const emptyForm = {
  supplierType: '', sCode: '', supplierName: '',
  address: '', address2: '', address3: '', address4: '',
  city: '', country: 'India', state: '', stateCode: '', pinCode: '',
  contactPerson: '', mobile: '', mobileCode: '+91', phone: '', phoneCode: '+91', email: '', website: '',
  gstNo: '', panNo: '',
  bankName: '', branchName: '', accountName: '', accountNumber: '', ifscCode: '', micrCode: '',
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function SupplierMaster() {
  const toast = useToast()

  const [supplierTypes, setSupplierTypes] = useState([])
  const [dropdownLoading, setDropdownLoading] = useState(true)

  const [rows, setRows] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [ifscLoading, setIfscLoading] = useState(false)

  const cityOptions = STATE_CITIES[form.state] || []
  const branchOptions = BANK_BRANCHES[form.bankName] || []

  // ── Fetch supplier types via reference_type table (Supplier_Type → values) ──
  const fetchSupplierTypes = useCallback(async () => {
    try {
      const res = await api.get('/api/reference-types/values/Supplier_Type')
      const types = (res.data.data || []).map(r => r.description)
      setSupplierTypes(types)
    } catch (err) {
      console.error('[SupplierMaster] fetchSupplierTypes error:', err)
      toast.error('Failed to load supplier types')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch all suppliers ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setTableLoading(true)
    try {
      const res = await api.get('/api/supplier-master')
      setRows(res.data.data || [])
    } catch (err) {
      console.error('[SupplierMaster] fetchAll error:', err)
      toast.error('Failed to load supplier records')
    } finally {
      setTableLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch next sCode for display in form ──────────────────────────────────
  const fetchNextCode = useCallback(async () => {
    try {
      const res = await api.get('/api/supplier-master/next-code')
      setForm(f => ({ ...f, sCode: res.data.nextSCode || '' }))
    } catch (err) {
      console.error('[SupplierMaster] fetchNextCode error:', err)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setDropdownLoading(true)
      await fetchSupplierTypes()
      setDropdownLoading(false)
      await Promise.all([fetchAll(), fetchNextCode()])
    }
    init()
  }, [fetchSupplierTypes, fetchAll, fetchNextCode])

  const setField = (k, v) => {
    let extra = {}
    if (k === 'state') extra = { stateCode: STATE_CODES[v] ?? '', city: '' }
    if (k === 'bankName') extra = { branchName: '', ifscCode: '', micrCode: '' }

    if (k === 'country') {
      const dialCode = getDialCodeFromCountry(v)
      if (dialCode) {
        extra = { ...extra, mobileCode: dialCode, phoneCode: dialCode }
      }
    } else if (k === 'mobileCode') {
      extra = { ...extra, phoneCode: v }
      const matched = COUNTRY_CODES.find(cc => cc.dial === v)
      if (matched && (!form.country || getDialCodeFromCountry(form.country) !== v)) {
        extra = { ...extra, country: matched.name }
      }
    } else if (k === 'phoneCode') {
      extra = { ...extra, mobileCode: v }
      const matched = COUNTRY_CODES.find(cc => cc.dial === v)
      if (matched && (!form.country || getDialCodeFromCountry(form.country) !== v)) {
        extra = { ...extra, country: matched.name }
      }
    }

    let value = v
    if (k === 'gstNo' || k === 'panNo') {
      value = v.toUpperCase()
    }

    setForm(f => ({ ...f, [k]: value, ...extra }))

    let err = ''
    if (k === 'supplierName') {
      if (!v.trim()) err = 'Required'
    } else if (k === 'supplierType') {
      if (!v) err = 'Required'
    } else if (k === 'email') {
      if (v && v.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(v.trim())) {
          err = 'Invalid email format'
        }
      }
    } else if (k === 'panNo') {
      if (value && value.trim()) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
        if (!panRegex.test(value.trim())) {
          err = 'Invalid PAN format (e.g. ABCDE1234F)'
        }
      }
    } else if (k === 'gstNo') {
      if (value && value.trim()) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
        if (!gstRegex.test(value.trim())) {
          err = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)'
        } else {
          const panVal = form.panNo || ''
          if (panVal.trim()) {
            const gstPan = value.trim().slice(2, 12).toUpperCase()
            if (gstPan !== panVal.trim().toUpperCase()) {
              err = 'GST number does not match the entered PAN number'
            }
          }
        }
      }
    }

    setErrors(e => {
      const newErrors = { ...e, [k]: err }
      const currentForm = { ...form, [k]: value, ...extra }

      // Validate phone/mobile
      newErrors.mobile = validatePhoneHelper(currentForm.mobile, currentForm.mobileCode, 'mobile number')
      newErrors.phone = validatePhoneHelper(currentForm.phone, currentForm.phoneCode, 'phone number')

      // Handle PAN / GST cross-validation errors on input changes
      if (k === 'panNo' || k === 'gstNo') {
        const currentPan = (k === 'panNo' ? value : form.panNo) || ''
        const currentGst = (k === 'gstNo' ? value : form.gstNo) || ''
        
        let panErr = ''
        let gstErr = ''

        if (currentPan.trim()) {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
          if (!panRegex.test(currentPan.trim())) {
            panErr = 'Invalid PAN format (e.g. ABCDE1234F)'
          }
        }

        if (currentGst.trim()) {
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
          if (!gstRegex.test(currentGst.trim())) {
            gstErr = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)'
          } else {
            if (currentPan.trim() && !panErr) {
              const gstPan = currentGst.trim().slice(2, 12).toUpperCase()
              if (gstPan !== currentPan.trim().toUpperCase()) {
                gstErr = 'GST number does not match the entered PAN number'
              }
            }
          }
        }

        newErrors.panNo = panErr
        newErrors.gstNo = gstErr
      }

      return newErrors
    })
  }

  const handleIfscChange = async (val) => {
    const clean = val.toUpperCase().replace(/\s/g, '')
    setForm(f => ({ ...f, ifscCode: clean }))
    if (clean.length === 11) {
      setIfscLoading(true)
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${clean}`)
        if (res.ok) {
          const data = await res.json()
          setForm(f => ({
            ...f,
            ifscCode: clean,
            micrCode: data.MICR || f.micrCode,
            bankName: f.bankName || data.BANK || '',
            branchName: f.branchName || data.BRANCH || '',
          }))
        }
      } catch (err) {
        console.error('[SupplierMaster] IFSC lookup error:', err)
      } finally {
        setIfscLoading(false)
      }
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.supplierType) errs.supplierType = 'Required'
    if (!form.supplierName.trim()) errs.supplierName = 'Required'
    
    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email.trim())) {
        errs.email = 'Invalid email format'
      }
    }
    
    const mobileErr = validatePhoneHelper(form.mobile, form.mobileCode, 'mobile number')
    if (mobileErr) errs.mobile = mobileErr

    const phoneErr = validatePhoneHelper(form.phone, form.phoneCode, 'phone number')
    if (phoneErr) errs.phone = phoneErr

    if (form.panNo && form.panNo.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(form.panNo.trim())) {
        errs.panNo = 'Invalid PAN format (e.g. ABCDE1234F)'
      }
    }

    if (form.gstNo && form.gstNo.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (!gstRegex.test(form.gstNo.trim())) {
        errs.gstNo = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)'
      } else {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
        if (form.panNo && form.panNo.trim() && panRegex.test(form.panNo.trim())) {
          const gstPan = form.gstNo.trim().slice(2, 12).toUpperCase()
          if (gstPan !== form.panNo.trim().toUpperCase()) {
            errs.gstNo = 'GST number does not match the entered PAN number'
          }
        }
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.warning('Please fill all required fields correctly.')
      return false
    }
    setErrors({})
    return true
  }

  // ── Save (create / update) ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        mobile: form.mobile ? form.mobile.trim() : '',
        mobileCode: form.mobileCode || null,
        phone: form.phone ? form.phone.trim() : '',
        phoneCode: form.phoneCode || null,
        email: form.email ? form.email.trim() : '',
        panNo: form.panNo ? form.panNo.trim().toUpperCase() : '',
        gstNo: form.gstNo ? form.gstNo.trim().toUpperCase() : '',
      }
      if (editId !== null) {
        await api.put(`/api/supplier-master/${editId}`, payload)
        toast.success('Supplier updated successfully.')
      } else {
        await api.post('/api/supplier-master', payload)
        toast.success('Supplier created successfully.')
      }
      setForm(emptyForm)
      setErrors({})
      setEditId(null)
      setPage(1)
      await fetchAll()
      await fetchNextCode()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save supplier.'
      console.error('[SupplierMaster] handleSave error:', err)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = row => {
    let mCode = row.mobileCode
    let mNum = row.mobile || ''
    if (!mCode && mNum) {
      const parsed = parsePhone(mNum)
      mCode = parsed.code
      mNum = parsed.number
    }

    let pCode = row.phoneCode
    let pNum = row.phone || ''
    if (!pCode && pNum) {
      const parsed = parsePhone(pNum)
      pCode = parsed.code
      pNum = parsed.number
    }

    setForm({
      supplierType: row.supplierType || '',
      sCode: row.sCode || '',
      supplierName: row.supplierName || '',
      address: row.address || '',
      address2: row.address2 || '',
      address3: row.address3 || '',
      address4: row.address4 || '',
      city: row.city || '',
      country: row.country || 'India',
      state: row.state || '',
      stateCode: row.stateCode || '',
      pinCode: row.pinCode || '',
      contactPerson: row.contactPerson || '',
      mobile: mNum,
      mobileCode: mCode || '+91',
      phone: pNum,
      phoneCode: pCode || '+91',
      email: row.email || '',
      website: row.website || '',
      gstNo: row.gstNo || '',
      panNo: row.panNo || '',
      bankName: row.bankName || '',
      branchName: row.branchName || '',
      accountName: row.accountName || '',
      accountNumber: row.accountNumber || '',
      ifscCode: row.ifscCode || '',
      micrCode: row.micrCode || '',
    })
    setErrors({})
    setEditId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteConfirm = id => setConfirmDelete(id)

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/supplier-master/${confirmDelete}`)
      toast.success('Supplier deleted.')
      setConfirmDelete(null)
      if (editId === confirmDelete) { setForm(emptyForm); setEditId(null) }
      await fetchAll()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete supplier.'
      console.error('[SupplierMaster] handleDelete error:', err)
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleClear = async () => {
    setForm(emptyForm)
    setErrors({})
    setEditId(null)
    await fetchNextCode()
  }

  // ── Filtering & Pagination ─────────────────────────────────────────────────
  const filtered = rows.filter(r =>
    [r.sCode, r.supplierName, r.city, r.state, r.contactPerson, r.mobile, r.email]
      .some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const ps = [1]
    if (page > 3) ps.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) ps.push(i)
    if (page < totalPages - 2) ps.push('...')
    ps.push(totalPages)
    return ps
  }

  const inp = (err) =>
    `w-full border rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 transition-colors bg-white ${
      err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
    }`
  const lbl = 'text-[12.5px] font-semibold text-slate-600 whitespace-nowrap'

  return (
    <div className="p-4 space-y-4 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Person Masters</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Supplier Master</span>
      </div>

      {/* ── Form ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit - Supplier Master Details' : 'Create - Supplier Master Details'}
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">

            {/* ── Col 1 ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Supplier Code :</label>
                <input
                  value={form.sCode}
                  onChange={e => setField('sCode', e.target.value)}
                  className={`${inp(false)} bg-slate-50`}
                  placeholder="Auto-generated"
                  readOnly
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}><span className="text-red-500">*</span> Supplier Name :</label>
                <div className="flex-1">
                  <input value={form.supplierName} onChange={e => setField('supplierName', e.target.value)} className={inp(errors.supplierName)} />
                  {errors.supplierName && <p className="text-[11px] text-red-500 mt-0.5">{errors.supplierName}</p>}
                </div>
              </div>
              {/* Supplier Type — from ReferenceMaster */}
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}><span className="text-red-500">*</span> Supplier Type :</label>
                <div className="flex-1 relative">
                  <select
                    value={form.supplierType}
                    onChange={e => setField('supplierType', e.target.value)}
                    disabled={dropdownLoading}
                    className={`${inp(errors.supplierType)} disabled:opacity-60`}
                  >
                    <option value="">
                      {dropdownLoading ? 'Loading...' : '--- Select ---'}
                    </option>
                    {supplierTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {dropdownLoading && (
                    <Loader2 className="animate-spin absolute right-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0097A7] pointer-events-none" />
                  )}
                  {errors.supplierType && <p className="text-[11px] text-red-500 mt-0.5">{errors.supplierType}</p>}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-28 shrink-0 pt-1`}>Address :</label>
                <div className="flex-1 space-y-1">
                  <textarea rows={3} value={form.address} onChange={e => setField('address', e.target.value)} className={inp(false)}></textarea>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Country :</label>
                <input value={form.country} onChange={e => setField('country', e.target.value)} className={inp(false)}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>State :</label>
                <SearchableSelect
                  value={form.state}
                  onChange={v => setField('state', v)}
                  options={INDIA_STATES}
                  placeholder="Search state..."
                  className={inp(false)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>State Code :</label>
                <input value={form.stateCode} readOnly className={`${inp(false)} bg-slate-50`}/>
              </div>
             
            </div>

            {/* ── Col 2 ── */}
            <div className="space-y-2">
              
              
               <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>City :</label>
                <SearchableSelect
                  value={form.city}
                  onChange={v => setField('city', v)}
                  options={cityOptions}
                  placeholder={form.state ? 'Search city...' : 'Select state first'}
                  disabled={!form.state}
                  className={inp(false)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>PinCode :</label>
                <input value={form.pinCode} onChange={e => setField('pinCode', e.target.value)} className={inp(false)}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Contact Person :</label>
                <input value={form.contactPerson} onChange={e => setField('contactPerson', e.target.value)} className={inp(false)}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Mobile Number :</label>
                <div className="flex-1 flex gap-1">
                  <select
                    value={form.mobileCode || '+91'}
                    onChange={e => setField('mobileCode', e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white w-20 shrink-0"
                  >
                    {COUNTRY_CODES.map(cc => (
                      <option key={cc.code} value={cc.dial}>{cc.dial} ({cc.code})</option>
                    ))}
                  </select>
                  <div className="flex-1">
                    <input
                      value={form.mobile}
                      onChange={e => setField('mobile', e.target.value)}
                      className={inp(errors.mobile)}
                      placeholder="Mobile number"
                    />
                    {errors.mobile && <p className="text-[11px] text-red-500 mt-0.5">{errors.mobile}</p>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Phone Number :</label>
                <div className="flex-1 flex gap-1">
                  <select
                    value={form.phoneCode || '+91'}
                    onChange={e => setField('phoneCode', e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white w-20 shrink-0"
                  >
                    {COUNTRY_CODES.map(cc => (
                      <option key={cc.code} value={cc.dial}>{cc.dial} ({cc.code})</option>
                    ))}
                  </select>
                  <div className="flex-1">
                    <input
                      value={form.phone}
                      onChange={e => setField('phone', e.target.value)}
                      className={inp(errors.phone)}
                      placeholder="Phone number"
                    />
                    {errors.phone && <p className="text-[11px] text-red-500 mt-0.5">{errors.phone}</p>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Email-ID :</label>
                <div className="flex-1">
                  <input value={form.email} onChange={e => setField('email', e.target.value)} type="email" className={inp(errors.email)} />
                  {errors.email && <p className="text-[11px] text-red-500 mt-0.5">{errors.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Website :</label>
                <input value={form.website} onChange={e => setField('website', e.target.value)} className={inp(false)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>GST No :</label>
                <div className="flex-1">
                  <input value={form.gstNo} onChange={e => setField('gstNo', e.target.value)} className={inp(errors.gstNo)} />
                  {errors.gstNo && <p className="text-[11px] text-red-500 mt-0.5">{errors.gstNo}</p>}
                </div>
              </div>
            </div>

            {/* ── Col 3 ── */}
            <div className="space-y-2">
              
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Pan No :</label>
                <div className="flex-1">
                  <input value={form.panNo} onChange={e => setField('panNo', e.target.value)} className={inp(errors.panNo)} />
                  {errors.panNo && <p className="text-[11px] text-red-500 mt-0.5">{errors.panNo}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Bank Name :</label>
                <SearchableSelect
                  value={form.bankName}
                  onChange={v => setField('bankName', v)}
                  options={INDIA_BANKS}
                  placeholder="Search bank..."
                  className={inp(false)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Branch Name :</label>
                <SearchableSelect
                  value={form.branchName}
                  onChange={v => setField('branchName', v)}
                  options={branchOptions}
                  placeholder={form.bankName ? 'Search branch...' : 'Select bank first'}
                  disabled={!form.bankName}
                  className={inp(false)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Account Name :</label>
                <input value={form.accountName} onChange={e => setField('accountName', e.target.value)} className={inp(false)}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Account Number :</label>
                <input value={form.accountNumber} onChange={e => setField('accountNumber', e.target.value)} className={inp(false)}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>IFSC Code :</label>
                <div className="flex-1 relative">
                  <input
                    value={form.ifscCode}
                    onChange={e => handleIfscChange(e.target.value)}
                    placeholder="Enter IFSC to auto-fill MICR"
                    maxLength={11}
                    className={`${inp(false)} uppercase pr-6`}
                  />
                  {ifscLoading && (
                    <Loader2 className="animate-spin absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0097A7]" />
                  )}
                  {!ifscLoading && form.ifscCode.length === 11 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-[11px]">✓</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>MICR Code :</label>
                <input
                  value={form.micrCode}
                  onChange={e => setField('micrCode', e.target.value)}
                  className={`${inp(false)} ${form.micrCode ? 'bg-slate-50' : ''}`}
                  placeholder="Auto-filled from IFSC"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || dropdownLoading}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {editId !== null ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60"
                >
                  <RotateCcw className="w-4 h-4"/> Clear
                </button>
                <button
                  onClick={() => { fetchAll(); setPage(1) }}
                  disabled={tableLoading}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60"
                >
                  {tableLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <List className="w-4 h-4"/>}
                  Display All
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Supplier Master Details</h2>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Search:
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border border-slate-300 rounded px-3 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-40"
            />
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Show
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
            >
              {PAGE_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
            entries
          </div>
        </div>
        {tableLoading ? (
          <TableSkeleton rows={5} cols={['5%', '9%', '16%', '9%', '9%', '12%', '10%', '13%', '7%', '7%']} />
        ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['S.No', 'S.Code', 'Name', 'City', 'State', 'Con. Person', 'Mobile', 'Email Id', 'Edit', 'Delete', 'Details'].map(h => (
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-400 text-[13px]">No records found</td>
                </tr>
              ) : paged.map((row, idx) => (
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-3 py-2 text-center">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-3 py-2 text-center">{row.sCode}</td>
                  <td className="px-3 py-2 text-center font-medium">{row.supplierName}</td>
                  <td className="px-3 py-2 text-center">{row.city}</td>
                  <td className="px-3 py-2 text-center">{row.state}</td>
                  <td className="px-3 py-2 text-center">{row.contactPerson}</td>
                  <td className="px-3 py-2 text-center">{row.mobile ? `${row.mobileCode ? `${row.mobileCode} ` : ''}${row.mobile}` : '—'}</td>
                  <td className="px-3 py-2 text-center">{row.email}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleEdit(row)}
                      className="px-3 py-1.5 bg-[--color-main] hover:bg-[#3498db] text-white text-[12px] rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4"/>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDeleteConfirm(row.id)}
                      disabled={deleting}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] rounded transition-colors disabled:opacity-60"
                      title="Delete"
                    >
                      {deleting && confirmDelete === row.id
                        ? <Loader2 className="w-4 h-4 animate-spin"/>
                        : <Trash2 className="w-4 h-4"/>}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => setDetailRow(row)}
                      className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] rounded transition-colors"
                      title="Details"
                    >
                      <Info className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-[12px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {pageNums().map((n, i) =>
              n === '...'
                ? <span key={`e${i}`} className="px-2 text-slate-400 text-[12px]">…</span>
                : <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 text-[12px] rounded border transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
                  >{n}</button>
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)}/>}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirm Delete"
        message="Delete this supplier? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
