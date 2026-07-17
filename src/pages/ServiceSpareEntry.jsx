import { useState, useEffect, useRef, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  ChevronRight, ChevronDown, FileSpreadsheet, Search, Save, Edit, Trash2, RotateCcw, Image
} from 'lucide-react'
import { openExcelPreview } from '../utils/excelPreview'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useServiceBookings, useBoms, useServiceSpares } from '../hooks/useMasterData'
import { useQueryClient } from '@tanstack/react-query'
import AuthenticatedImage from '../components/AuthenticatedImage'


// ── Ultra-compact, premium UI primitives ──
const Label = ({ children, required }) => (
  <label className="inline-flex items-center text-[12.5px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
    {required && <span className="text-red-500 font-bold mr-1">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = '' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-2.5 py-1 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-bold' : 'hover:border-slate-400'} ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = '' }) => (
  <div className={`relative w-full ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2.5 py-1 pr-6 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 hover:border-slate-400 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const Combobox = ({ options, placeholder, value, onChange, readOnly = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value || '')
  const containerRef = useRef(null)

  useEffect(() => {
    setSearch(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!search || search === value) return options
    const s = search.toLowerCase()
    return options.filter(o => o && o.toLowerCase().includes(s))
  }, [options, search, value])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        readOnly={readOnly}
        onChange={e => {
          setSearch(e.target.value)
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (!readOnly) setIsOpen(true)
        }}
        className={`w-full px-2.5 py-1 pr-8 text-[13px] h-[32px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-bold' : 'hover:border-slate-400'}`}
      />
      {!readOnly && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {isOpen && !readOnly && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 text-[12.5px] italic">No results found</div>
          ) : (
            filteredOptions.map(o => (
              <div
                key={o}
                onClick={() => {
                  onChange(o)
                  setSearch(o)
                  setIsOpen(false)
                }}
                className="px-3 py-1.5 text-[13px] text-slate-700 hover:bg-[#0097A7]/10 hover:text-[#0097A7] cursor-pointer transition-colors"
              >
                {o}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Helper to extract BOM parts from a BOM creation record's excelRows
const getBomRowsFromExcel = (excelRows, itemMasterList) => {
  if (!Array.isArray(excelRows)) return [];

  return excelRows.map((row, index) => {
    const keys = Object.keys(row);

    const partNoKey = keys.find(k => {
      const l = k.toLowerCase();
      return l.includes('part number') || l.includes('part no') || l === 'part' || l === 'partno';
    });

    const partNameKey = keys.find(k => {
      const l = k.toLowerCase();
      return l.includes('part name') || l.includes('name') || l.includes('desc') || l.includes('description');
    });

    const qtyKey = keys.find(k => {
      const l = k.toLowerCase();
      return l.includes('qty') || l.includes('quantity') || l.includes('faster qty') || l.includes('req');
    });

    const unitKey = keys.find(k => {
      const l = k.toLowerCase();
      return l === 'uom' || l === 'unit' || l.includes('unit');
    });

    const rateKey = keys.find(k => {
      const l = k.toLowerCase();
      return l.includes('rate') || l.includes('price') || l.includes('amount') || l.includes('cost');
    });

    const partNo = partNoKey ? String(row[partNoKey] || '').trim() : '';
    if (!partNo) return null;

    let partName = partNameKey ? String(row[partNameKey] || '').trim() : '';
    const fasterQty = qtyKey ? Number(row[qtyKey]) || 1 : 1;
    const unit = unitKey ? String(row[unitKey] || '').trim() : 'Nos';
    let rate = rateKey ? Number(row[rateKey]) || 0 : 0;

    if (Array.isArray(itemMasterList)) {
      const matchedItem = itemMasterList.find(
        item => String(item.partNo || '').trim().toLowerCase() === partNo.toLowerCase()
      );
      if (matchedItem) {
        if (!partName) partName = matchedItem.partName;
        if (rate === 0 && matchedItem.rate) rate = matchedItem.rate;
      }
    }

    return {
      partNo,
      partName: partName || partNo,
      fasterQty,
      unit,
      rate
    };
  }).filter(Boolean);
};

// Helper to construct nested BOM rows (assemblies as parents, parts as children)
const buildNestedBomRows = (matchingBoms, itemMasterList, selectedPartNo, selectedParts = []) => {
  if (selectedPartNo) {
    let allExtracted = [];
    matchingBoms.forEach(b => {
      if (Array.isArray(b.excelRows)) {
        const extracted = getBomRowsFromExcel(b.excelRows, itemMasterList);
        extracted.forEach(p => {
          allExtracted.push({
            part: p,
            bomId: b.id
          });
        });
      }
    });

    const seen = new Set();
    const uniquePartsMap = new Map();
    let globalId = 1;
    allExtracted.forEach(item => {
      const pNo = item.part.partNo.toLowerCase();
      if (!seen.has(pNo)) {
        seen.add(pNo);
        uniquePartsMap.set(pNo, {
          ...item.part,
          id: globalId,
          selected: selectedParts.includes(globalId),
          issuedQty: selectedParts.includes(globalId) ? item.part.fasterQty : 0
        });
        globalId++;
      }
    });

    return matchingBoms.map(b => {
      const bParts = [];
      if (Array.isArray(b.excelRows)) {
        const extracted = getBomRowsFromExcel(b.excelRows, itemMasterList);
        const addedPartNos = new Set();
        extracted.forEach(p => {
          const pNo = p.partNo.toLowerCase();
          if (uniquePartsMap.has(pNo) && !addedPartNos.has(pNo)) {
            bParts.push(uniquePartsMap.get(pNo));
            addedPartNos.add(pNo);
          }
        });
      }

      return {
        id: b.id,
        bomNo: b.bomNo || '—',
        assemblyPartNo: b.assemblyPartNo || '—',
        groupName: b.groupName || '—',
        model: b.model || '—',
        date: b.date || '—',
        parts: bParts
      };
    });

  } else {
    let globalId = 1;
    return matchingBoms.map(b => {
      let bParts = [];
      if (Array.isArray(b.excelRows)) {
        const extracted = getBomRowsFromExcel(b.excelRows, itemMasterList);
        bParts = extracted.map(p => {
          const partId = globalId++;
          const isSelected = selectedParts.includes(partId);
          return {
            ...p,
            id: partId,
            selected: isSelected,
            issuedQty: isSelected ? p.fasterQty : 0
          };
        });
      }

      return {
        id: b.id,
        bomNo: b.bomNo || '—',
        assemblyPartNo: b.assemblyPartNo || '—',
        groupName: b.groupName || '—',
        model: b.model || '—',
        date: b.date || '—',
        parts: bParts
      };
    });
  }
};

// BOM spare parts seed data (mock data removed)
const BOM_PARTS = [];

const STANDARD_ASSEMBLIES = [
  { id: 1, name: 'Engine System & Mounts' },
  { id: 2, name: 'Hydraulic Main Pump & Valves' },
  { id: 3, name: 'Mast Structure & Lifting Cylinders' },
  { id: 4, name: 'Crawler Track rollers & Tensioners' },
  { id: 5, name: 'Rotary Head Swivel Assembly' },
  { id: 6, name: 'Control Panel & Joystick Valve block' },
  { id: 7, name: 'Compressor Lubricator Unit' },
  { id: 8, name: 'Winches & Steel Wire ropes' },
  { id: 9, name: 'Electric Harness & Ignition' },
  { id: 10, name: 'Feed Cylinder Assembly' }
]

export default function ServiceSpareEntry() {
  const toast = useToast()
  const queryClient = useQueryClient()

  // React Query hooks for Master Data
  const { data: bookingsDataRes = [] } = useServiceBookings()
  const { data: bomCreationsList = [] } = useBoms()
  const { data: sparesList = [] } = useServiceSpares()

  const [selectedItemForImage, setSelectedItemForImage] = useState(null)

  // Memoized jobs list formatted from bookingsDataRes
  const jobsList = useMemo(() => {
    return bookingsDataRes.map(b => ({
      serviceJobNo: b.serviceJobNo || '—',
      customerCode: b.customerCode || '—',
      customerName: b.customerName || '—',
      bookingId: b.bookingId,
      bookingDate: b.bookingDate,
      serialNo: b.vehicleSerialNo || b.serialNo || '—',
      vehicleNo: b.vehicleNo || '—',
      vehicleModelNo: b.vehicleModelNo || '—',
      modelSubType: b.modelSubType || '—',
      vehicleName: b.vehicleName || '—',
      status: b.status || 'Pending',
      count: b.customerVehicleCount || 1
    }))
  }, [bookingsDataRes])

  const [filteredSpares, setFilteredSpares] = useState([])
  const [serviceDetailsList, setServiceDetailsList] = useState([])
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [editingId, setEditingId] = useState(null)

  // Sub-table display and selection states
  const [expandedSpareIds, setExpandedSpareIds] = useState({})
  const [selectedChildRowKey, setSelectedChildRowKey] = useState('')
  const [selectedChildPartNo, setSelectedChildPartNo] = useState('')

  // Form fields
  const [serviceJobNo, setServiceJobNo] = useState('')
  const [bookingCustomerCode, setBookingCustomerCode] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerCode, setCustomerCode] = useState('')
  const [displayDate, setDisplayDate] = useState(new Date().toISOString().split('T')[0])
  const [lastSavedAssName, setLastSavedAssName] = useState('')
  const [servicePartNo, setServicePartNo] = useState('')
  const [vehicleNo, setVehicleNo] = useState('')
  const [serialNo, setSerialNo] = useState('')
  const [vehicleModelNo, setVehicleModelNo] = useState('')
  const [modelSubType, setModelSubType] = useState('')
  const [vehicleName, setVehicleName] = useState('')
  const [status, setStatus] = useState('')

  // BOM list states
  const [bomRows, setBomRows] = useState([])
  const [expandedAssemblyIds, setExpandedAssemblyIds] = useState({})
  const [selectAllBOM, setSelectAllBOM] = useState(false)
  const [sameFasterQty, setSameFasterQty] = useState(false)
  const [activeBOMPartNo, setActiveBOMPartNo] = useState('')

  // Filter
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    setSearchQuery(searchText)
  }

  // Load page-specific service details on mount
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const detailsRes = await api.get('/api/service-detail')
        setServiceDetailsList(detailsRes.data?.data || [])
      } catch (err) {
        console.error('Failed to load service details:', err)
      }
    }
    fetchServiceDetails()
  }, [])

  // Auto-fill when Job No selected
  useEffect(() => {
    if (!serviceJobNo) return
    const job = jobsList.find(j => j.serviceJobNo === serviceJobNo)
    const bomMatch = bomCreationsList.find(b => b.serviceJobNo === serviceJobNo)

    const matchedRecord = job || bomMatch

    if (matchedRecord) {
      const custCode = matchedRecord.customerCode || ''
      const custName = matchedRecord.customerName || ''
      const serial = matchedRecord.vehicleSerialNo || matchedRecord.serialNo || ''
      const model = matchedRecord.model || matchedRecord.vehicleModelNo || ''
      const vehNo = matchedRecord.vehicleNo || ''
      const subType = matchedRecord.modelSubType || ''
      const vehName = matchedRecord.vehicleName || ''

      setBookingCustomerCode(custCode)
      setCustomerName(custName)
      setCustomerCode(custCode)
      setSerialNo(serial)
      setVehicleNo(vehNo)
      setVehicleModelNo(model)
      setModelSubType(subType)
      setVehicleName(vehName)

      // Field details loaded message
      toast.success(`Loaded details for Job No: ${serviceJobNo}`)
    }
  }, [serviceJobNo, jobsList, bomCreationsList, editingId, itemMasterList])

  // Reactive dynamic populating of bomRows based on selected serviceJobNo and servicePartNo
  useEffect(() => {
    if (editingId !== null) return;
    if (!serviceJobNo) {
      setBomRows([]);
      setExpandedAssemblyIds({});
      return;
    }

    const selectedPartNo = servicePartNo ? servicePartNo.split(' - ')[0].trim() : '';

    let matchingBoms = [];
    if (selectedPartNo) {
      matchingBoms = bomCreationsList.filter(b =>
        b.assemblyPartNo && b.assemblyPartNo.trim().toLowerCase() === selectedPartNo.toLowerCase()
      );
    } else {
      const detail = serviceDetailsList.find(d => d.serviceJobNo === serviceJobNo);
      const checkedAssemblies = detail?.checkedAssemblies || [];

      checkedAssemblies.forEach(assPartNo => {
        const bom = bomCreationsList.find(b =>
          b.assemblyPartNo && b.assemblyPartNo.trim().toLowerCase() === assPartNo.trim().toLowerCase()
        );
        if (bom) {
          matchingBoms.push(bom);
        } else {
          matchingBoms.push({
            id: `temp-${assPartNo}`,
            bomNo: '—',
            assemblyPartNo: assPartNo,
            groupName: assPartNo,
            model: vehicleModelNo || '—',
            excelRows: []
          });
        }
      });
    }

    if (matchingBoms.length > 0) {
      const nested = buildNestedBomRows(matchingBoms, [], selectedPartNo, []);
      setBomRows(nested);

      // Expand all assemblies by default
      const initialExpanded = {};
      nested.forEach(b => {
        initialExpanded[b.id] = true;
      });
      setExpandedAssemblyIds(initialExpanded);
    } else {
      setBomRows([]);
      setExpandedAssemblyIds({});
    }
  }, [serviceJobNo, servicePartNo, bomCreationsList, serviceDetailsList, editingId, vehicleModelNo])

  const serviceJobNoOptions = useMemo(() => {
    const unique = [...new Set(jobsList.map(j => j.serviceJobNo).filter(j => j && j !== '—'))]
    if (serviceJobNo && serviceJobNo !== '—' && !unique.includes(serviceJobNo)) {
      unique.push(serviceJobNo)
    }
    return unique
  }, [jobsList, serviceJobNo])

  // Memoized unique assembly parts from Service Details checklist matching selected job number
  const servicePartNoOptions = useMemo(() => {
    if (!serviceJobNo || !serviceDetailsList.length) return []
    const detail = serviceDetailsList.find(
      d => d.serviceJobNo && d.serviceJobNo.toLowerCase() === serviceJobNo.toLowerCase()
    )
    if (!detail || !detail.checkedAssemblies?.length) return []

    const partMap = new Map()
    bomCreationsList.forEach(b => {
      if (b.assemblyPartNo) {
        const pNo = b.assemblyPartNo.trim()
        partMap.set(pNo.toLowerCase(), b.groupName ? `${pNo} - ${b.groupName}` : pNo)
      }
      if (Array.isArray(b.excelRows)) {
        b.excelRows.forEach(row => {
          const keys = Object.keys(row)
          const pNoKey = keys.find(k => {
            const l = k.toLowerCase()
            return l.includes('part number') || l.includes('part no') || l === 'part' || l === 'partno'
          })
          const pNameKey = keys.find(k => {
            const l = k.toLowerCase()
            return l.includes('part name') || l.includes('name') || l.includes('desc') || l.includes('description')
          })
          if (pNoKey) {
            const partNo = String(row[pNoKey] || '').trim()
            const partName = pNameKey ? String(row[pNameKey] || '').trim() : ''
            partMap.set(partNo.toLowerCase(), partName ? `${partNo} - ${partName}` : partNo)
          }
        })
      }
    })

    return detail.checkedAssemblies.map(id => {
      const idStr = String(id).trim()
      const matchedName = partMap.get(idStr.toLowerCase())
      if (matchedName) return matchedName

      // Fallback: search matchingBoms matching assemblyPartNo
      const bom = bomCreationsList.find(b => b.assemblyPartNo && b.assemblyPartNo.trim().toLowerCase() === idStr.toLowerCase())
      if (bom) {
        return bom.groupName ? `${idStr} - ${bom.groupName}` : idStr
      }

      return idStr
    }).filter(Boolean)
  }, [serviceJobNo, serviceDetailsList, bomCreationsList])

  useEffect(() => {
    let partNoToUse = ''
    if (selectedChildPartNo) {
      partNoToUse = selectedChildPartNo.split(' - ')[0].trim()
    } else if (activeBOMPartNo) {
      partNoToUse = activeBOMPartNo.split(' - ')[0].trim()
    } else if (servicePartNo) {
      partNoToUse = servicePartNo.split(' - ')[0].trim()
    } else if (selectedRowId) {
      const selectedRow = sparesList.find(s => s.id === selectedRowId)
      if (selectedRow && selectedRow.servicePartNo) {
        partNoToUse = selectedRow.servicePartNo.split(' - ')[0].trim()
      }
    }

    if (!partNoToUse) {
      setSelectedItemForImage(null)
      return
    }

    const fetchImageItem = async () => {
      try {
        const res = await api.get(`/api/item-master?search=${encodeURIComponent(partNoToUse)}&limit=1`, { skipGlobalLoader: true })
        const matchedItem = res.data?.data?.[0]
        if (matchedItem && String(matchedItem.partNo || '').trim().toLowerCase() === partNoToUse.toLowerCase()) {
          setSelectedItemForImage(matchedItem)
        } else {
          setSelectedItemForImage(null)
        }
      } catch (err) {
        console.error('Failed to fetch image item:', err)
        setSelectedItemForImage(null)
      }
    }
    fetchImageItem()
  }, [selectedChildPartNo, activeBOMPartNo, servicePartNo, selectedRowId, sparesList])

  const bookingCustomerCodeOptions = useMemo(() => {
    let list = jobsList
    if (customerName && customerName !== '—') {
      list = list.filter(j => j.customerName === customerName)
    }
    if (serviceJobNo && serviceJobNo !== '—') {
      const isBookingJob = jobsList.some(j => j.serviceJobNo === serviceJobNo)
      if (isBookingJob) {
        list = list.filter(j => j.serviceJobNo === serviceJobNo)
      } else {
        const bomMatch = bomCreationsList.find(b => b.serviceJobNo === serviceJobNo)
        if (bomMatch) {
          return [bomMatch.customerCode].filter(Boolean)
        }
      }
    }
    return [...new Set(list.map(j => j.customerCode).filter(Boolean))]
  }, [jobsList, bomCreationsList, customerName, serviceJobNo])

  const customerNameOptions = useMemo(() => {
    let list = jobsList
    if (bookingCustomerCode && bookingCustomerCode !== '—') {
      list = list.filter(j => j.customerCode === bookingCustomerCode)
    }
    if (serviceJobNo && serviceJobNo !== '—') {
      const isBookingJob = jobsList.some(j => j.serviceJobNo === serviceJobNo)
      if (isBookingJob) {
        list = list.filter(j => j.serviceJobNo === serviceJobNo)
      } else {
        const bomMatch = bomCreationsList.find(b => b.serviceJobNo === serviceJobNo)
        if (bomMatch) {
          return [bomMatch.customerName].filter(Boolean)
        }
      }
    }
    return [...new Set(list.map(j => j.customerName).filter(Boolean))]
  }, [jobsList, bomCreationsList, bookingCustomerCode, serviceJobNo])

  const handleCustomerNameChange = (nameVal) => {
    setCustomerName(nameVal)
    if (!nameVal) {
      setBookingCustomerCode('')
      setCustomerCode('')
      setServiceJobNo('')
      setSerialNo('')
      setVehicleNo('')
      setVehicleModelNo('')
      setModelSubType('')
      setVehicleName('')
      setStatus('')
      return
    }

    const match = jobsList.find(j => j.customerName === nameVal)
    const bomMatch = bomCreationsList.find(b => b.customerName === nameVal)
    if (match || bomMatch) {
      const code = bomMatch?.customerCode || match?.customerCode || ''
      setBookingCustomerCode(code)
      setCustomerCode(code)
    }

    if (serviceJobNo) {
      const currentJob = jobsList.find(j => j.serviceJobNo === serviceJobNo)
      const currentBom = bomCreationsList.find(b => b.serviceJobNo === serviceJobNo)
      const currentJobName = currentBom?.customerName || currentJob?.customerName
      if (!currentJobName || currentJobName !== nameVal) {
        setServiceJobNo('')
        setSerialNo('')
        setVehicleNo('')
        setVehicleModelNo('')
        setModelSubType('')
        setVehicleName('')
        setStatus('')
      }
    }
  }

  const handleBookingCustomerCodeChange = (codeVal) => {
    setBookingCustomerCode(codeVal)
    setCustomerCode(codeVal)
    if (!codeVal) {
      setCustomerName('')
      setServiceJobNo('')
      setSerialNo('')
      setVehicleNo('')
      setVehicleModelNo('')
      setModelSubType('')
      setVehicleName('')
      setStatus('')
      return
    }

    const match = jobsList.find(j => j.customerCode === codeVal)
    const bomMatch = bomCreationsList.find(b => b.customerCode === codeVal)
    if (match || bomMatch) {
      setCustomerName(bomMatch?.customerName || match?.customerName || '')
    }

    if (serviceJobNo) {
      const currentJob = jobsList.find(j => j.serviceJobNo === serviceJobNo)
      const currentBom = bomCreationsList.find(b => b.serviceJobNo === serviceJobNo)
      const currentJobCode = currentBom?.customerCode || currentJob?.customerCode
      if (!currentJobCode || currentJobCode !== codeVal) {
        setServiceJobNo('')
        setSerialNo('')
        setVehicleNo('')
        setVehicleModelNo('')
        setModelSubType('')
        setVehicleName('')
        setStatus('')
      }
    }
  }

  const handleServiceJobNoChange = (jobNoVal) => {
    setServiceJobNo(jobNoVal)
    setServicePartNo('')
    setActiveBOMPartNo('')
    if (!jobNoVal) {
      setSerialNo('')
      setVehicleNo('')
      setVehicleModelNo('')
      setModelSubType('')
      setVehicleName('')
      setStatus('')
      setBomRows([])
      return
    }

    const job = jobsList.find(j => j.serviceJobNo === jobNoVal)
    const bomMatch = bomCreationsList.find(b => b.serviceJobNo === jobNoVal)

    const matchedRecord = job || bomMatch

    if (matchedRecord) {
      const custCode = matchedRecord.customerCode || ''
      const custName = matchedRecord.customerName || ''
      const serial = matchedRecord.vehicleSerialNo || matchedRecord.serialNo || ''
      const model = matchedRecord.model || matchedRecord.vehicleModelNo || ''
      const vehNo = matchedRecord.vehicleNo || ''
      const subType = matchedRecord.modelSubType || ''
      const vehName = matchedRecord.vehicleName || ''
      const stat = matchedRecord.status || 'Pending'

      setBookingCustomerCode(custCode)
      setCustomerName(custName)
      setCustomerCode(custCode)
      setSerialNo(serial)
      setVehicleNo(vehNo)
      setVehicleModelNo(model)
      setModelSubType(subType)
      setVehicleName(vehName)
      setStatus(stat)
      toast.success(`Loaded details for Job No: ${jobNoVal}`)
    }
  }

  // Reactive filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSpares(sparesList)
      return
    }
    const q = searchQuery.toLowerCase()
    setFilteredSpares(sparesList.filter(s =>
      (s.serviceJobNo || '').toLowerCase().includes(q) ||
      (s.customerName || '').toLowerCase().includes(q) ||
      (s.vehicleModelNo || '').toLowerCase().includes(q)
    ))
  }, [searchQuery, sparesList])

  // Select All BOM toggle
  const handleSelectAllBOM = (checked) => {
    setSelectAllBOM(checked)
    setBomRows(prev => prev.map(assembly => ({
      ...assembly,
      parts: assembly.parts.map(p => {
        const nextSelected = checked;
        return {
          ...p,
          selected: nextSelected,
          issuedQty: (sameFasterQty && nextSelected) ? p.fasterQty : p.issuedQty
        }
      })
    })))
  }

  // Same Faster Qty to Issued Qty toggle
  useEffect(() => {
    if (sameFasterQty) {
      setBomRows(prev => prev.map(assembly => ({
        ...assembly,
        parts: assembly.parts.map(p => p.selected ? { ...p, issuedQty: p.fasterQty } : p)
      })))
    }
  }, [sameFasterQty])

  const handleBOMRowSelect = (id) => {
    setBomRows(prev => {
      const updated = prev.map(assembly => ({
        ...assembly,
        parts: assembly.parts.map(p => {
          if (p.id === id) {
            const nextSelected = !p.selected
            return {
              ...p,
              selected: nextSelected,
              issuedQty: (sameFasterQty && nextSelected) ? p.fasterQty : p.issuedQty
            }
          }
          return p
        })
      }))

      let allSelected = true
      let count = 0
      updated.forEach(assembly => {
        assembly.parts.forEach(p => {
          count++
          if (!p.selected) allSelected = false
        })
      })
      setSelectAllBOM(count > 0 && allSelected)

      return updated
    })
  }

  const handleIssuedQtyChange = (id, val) => {
    const numVal = Number(val)
    setBomRows(prev => prev.map(assembly => ({
      ...assembly,
      parts: assembly.parts.map(p => p.id === id ? { ...p, issuedQty: numVal } : p)
    })))
  }

  const getSelectedParts = () => {
    const selected = []
    bomRows.forEach(assembly => {
      assembly.parts.forEach(p => {
        if (p.selected) {
          selected.push(p)
        }
      })
    })
    return selected
  }

  const getTotalAmount = () => getSelectedParts().reduce((sum, r) => sum + (r.issuedQty * r.rate), 0)

  // Save
  const handleSave = async () => {
    if (!serviceJobNo) {
      toast.warning('Please select a Service Job No.')
      return
    }
    const selectedPartsList = getSelectedParts()
    const invalidPart = selectedPartsList.find(r => r.issuedQty > r.fasterQty)
    if (invalidPart) {
      toast.error(`Issued Qty cannot exceed Faster Qty (${invalidPart.fasterQty}) for part ${invalidPart.partNo}!`)
      return
    }
    const selectedParts = selectedPartsList.map(r => r.id)

    const items = []
    bomRows.forEach(assembly => {
      if (Array.isArray(assembly.parts)) {
        assembly.parts.forEach(p => {
          items.push({
            partNo: p.partNo,
            partName: p.partName,
            requiredQty: p.fasterQty,
            issuedQty: p.issuedQty || 0,
            balanceQty: p.fasterQty - (p.issuedQty || 0),
            uom: p.unit || 'Nos'
          })
        })
      }
    })

    const newEntry = {
      serviceJobNo,
      bookingCustomerCode,
      customerName,
      customerCode,
      displayOrder: 1,
      displayDate,
      lastSavedAssName,
      servicePartNo,
      vehicleNo,
      serialNo,
      vehicleModelNo,
      modelSubType,
      vehicleName,
      status,
      selectedParts,
      totalAmount: getTotalAmount(),
      savedDate: new Date().toISOString().split('T')[0],
      items
    }


    try {
      if (editingId !== null) {
        await api.put(`/api/service-spare/${editingId}`, newEntry, { loadingMessage: 'Updating record...' })
        toast.success(`Spare entry for Job ${serviceJobNo} updated!`)
        setEditingId(null)
      } else {
        await api.post('/api/service-spare', newEntry, { loadingMessage: 'Saving record...' })
        toast.success(`Spare entry for Job ${serviceJobNo} saved!`)
      }

      queryClient.invalidateQueries({ queryKey: ['service-spare'] })
      handleClear()
    } catch (err) {
      console.error('Failed to save service spare entry', err)
      toast.error('Failed to save service spare entry. ' + (err.response?.data?.message || err.message))
    }
  }

  const handleEditRow = (row) => {
    setEditingId(row.id)
    setServiceJobNo(row.serviceJobNo)
    setActiveBOMPartNo('')
    setSelectedChildRowKey('')
    setSelectedChildPartNo('')
    setBookingCustomerCode(row.bookingCustomerCode || '')
    setCustomerName(row.customerName)
    setCustomerCode(row.customerCode)
    setDisplayDate(row.displayDate || '')
    setLastSavedAssName(row.lastSavedAssName || '')
    setServicePartNo(row.servicePartNo || '')
    setVehicleNo(row.vehicleNo)
    setSerialNo(row.serialNo)
    setVehicleModelNo(row.vehicleModelNo)
    setModelSubType(row.modelSubType)
    setVehicleName(row.vehicleName)
    setStatus(row.status || '')

    const selectedPartNo = row.servicePartNo ? row.servicePartNo.split(' - ')[0].trim() : '';

    // Rebuild bomRows dynamically
    let matchingBoms = [];
    if (selectedPartNo) {
      matchingBoms = bomCreationsList.filter(b =>
        b.assemblyPartNo && b.assemblyPartNo.trim().toLowerCase() === selectedPartNo.toLowerCase()
      );
    } else {
      const detail = serviceDetailsList.find(d => d.serviceJobNo === row.serviceJobNo);
      const checkedAssemblies = detail?.checkedAssemblies || [];

      checkedAssemblies.forEach(assPartNo => {
        const bom = bomCreationsList.find(b =>
          b.assemblyPartNo && b.assemblyPartNo.trim().toLowerCase() === assPartNo.trim().toLowerCase()
        );
        if (bom) {
          matchingBoms.push(bom);
        } else {
          let displayName = assPartNo;
          if (Array.isArray(itemMasterList)) {
            const matchedItem = itemMasterList.find(
              item => String(item.partNo || '').trim().toLowerCase() === assPartNo.trim().toLowerCase()
            );
            if (matchedItem && matchedItem.partName) displayName = matchedItem.partName;
          }
          matchingBoms.push({
            id: `temp-${assPartNo}`,
            bomNo: '—',
            assemblyPartNo: assPartNo,
            groupName: displayName,
            model: row.vehicleModelNo || '—',
            excelRows: []
          });
        }
      });

      if (matchingBoms.length === 0) {
        matchingBoms = bomCreationsList.filter(b =>
          (b.serviceJobNo && b.serviceJobNo === row.serviceJobNo) ||
          (b.serialJobNo && b.serialJobNo === row.serviceJobNo)
        );
      }
    }

    if (matchingBoms.length > 0) {
      const nested = buildNestedBomRows(matchingBoms, [], selectedPartNo, row.selectedParts || []);
      setEditingRowBomRows(nested);

      const expanded = {};
      nested.forEach(b => {
        expanded[b.id] = true;
      });
      setExpandedAssemblyIds(expanded);

      let allSelected = true
      let count = 0
      nested.forEach(assembly => {
        assembly.parts.forEach(p => {
          count++
          if (!p.selected) allSelected = false
        })
      })
      setSelectAllBOM(count > 0 && allSelected)
    } else {
      setBomRows([])
      setExpandedAssemblyIds({})
      setSelectAllBOM(false)
    }
    toast.warning(`Editing spare entry for Job: ${row.serviceJobNo}`)
  }

  const handleDelete = async () => {
    if (!selectedRowId) {
      toast.warning('Please select a row to delete.')
      return
    }
    if (window.confirm('Delete this spare entry?')) {
      try {
        await api.delete(`/api/service-spare/${selectedRowId}`, { loadingMessage: 'Deleting record...' })
        queryClient.invalidateQueries({ queryKey: ['service-spare'] })
        toast.error('Spare entry deleted successfully.')
        handleClear()
      } catch (err) {
        console.error('Failed to delete service spare', err)
        toast.error('Failed to delete service spare.')
      }
    }
  }

  const getSpareChildEntries = (row) => {
    const selectedPartNo = row.servicePartNo ? row.servicePartNo.split(' - ')[0].trim() : '';

    let matchingBoms = [];
    if (selectedPartNo) {
      matchingBoms = bomCreationsList.filter(b =>
        b.assemblyPartNo && b.assemblyPartNo.trim().toLowerCase() === selectedPartNo.toLowerCase()
      );
    } else {
      const detail = serviceDetailsList.find(d => d.serviceJobNo === row.serviceJobNo);
      const checkedAssemblies = detail?.checkedAssemblies || [];

      checkedAssemblies.forEach(assPartNo => {
        const bom = bomCreationsList.find(b =>
          b.assemblyPartNo && b.assemblyPartNo.trim().toLowerCase() === assPartNo.trim().toLowerCase()
        );
        if (bom) {
          matchingBoms.push(bom);
        } else {
          let displayName = assPartNo;
          if (Array.isArray(itemMasterList)) {
            const matchedItem = itemMasterList.find(
              item => String(item.partNo || '').trim().toLowerCase() === assPartNo.trim().toLowerCase()
            );
            if (matchedItem && matchedItem.partName) displayName = matchedItem.partName;
          }
          matchingBoms.push({
            id: `temp-${assPartNo}`,
            bomNo: '—',
            assemblyPartNo: assPartNo,
            groupName: displayName,
            model: row.vehicleModelNo || '—',
            excelRows: []
          });
        }
      });

      if (matchingBoms.length === 0) {
        matchingBoms = bomCreationsList.filter(b =>
          (b.serviceJobNo && b.serviceJobNo === row.serviceJobNo) ||
          (b.serialJobNo && b.serialJobNo === row.serviceJobNo)
        );
      }
    }

    if (selectedPartNo) {
      let allExtracted = [];
      matchingBoms.forEach(b => {
        if (Array.isArray(b.excelRows)) {
          const extracted = getBomRowsFromExcel(b.excelRows, itemMasterList);
          extracted.forEach(p => {
            allExtracted.push({
              part: p,
              bomId: b.id
            });
          });
        }
      });

      const seen = new Set();
      const uniqueParts = [];
      let globalId = 1;
      allExtracted.forEach(item => {
        const pNo = item.part.partNo.toLowerCase();
        if (!seen.has(pNo)) {
          seen.add(pNo);
          const partId = globalId++;
          const isSelected = (row.selectedParts || []).includes(partId);
          if (isSelected) {
            uniqueParts.push({
              ...item.part,
              id: partId,
              issuedQty: item.part.fasterQty
            });
          }
        }
      });
      return uniqueParts;
    } else {
      const parts = [];
      let globalId = 1;
      matchingBoms.forEach(b => {
        if (Array.isArray(b.excelRows)) {
          const extracted = getBomRowsFromExcel(b.excelRows, itemMasterList);
          extracted.forEach(p => {
            const partId = globalId++;
            const isSelected = (row.selectedParts || []).includes(partId);
            if (isSelected) {
              parts.push({
                ...p,
                id: partId,
                issuedQty: p.fasterQty
              });
            }
          });
        }
      });
      return parts;
    }
  }

  const handleExportSpareChildExcel = async (spareRecord) => {
    const childEntries = getSpareChildEntries(spareRecord)
    if (childEntries.length === 0) return
    try {
      const workbook = XLSX.utils.book_new()
      const data = childEntries.map((row, idx) => ({
        'S.No': idx + 1,
        'Part No': row.partNo,
        'Part Name': row.partName,
        'Faster Qty': row.fasterQty,
        'Issued Qty': row.issuedQty,
        'Unit': row.unit,
        'Rate (₹)': row.rate,
        'Amount (₹)': row.issuedQty * row.rate
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, ws, 'ChildParts')
      const workbookBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const workbookBlob = new Blob([workbookBuffer], { type: 'application/octet-stream' })
      openExcelPreview(exportData, workbookBlob, `spare_entry_${spareRecord.serviceJobNo}_child_entries_${new Date().toISOString().split('T')[0]}.xlsx`, 'Spare Entry Child Records Preview')
      toast.success('Excel downloaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Error exporting child entries to Excel')
    }
  }

  const handlePrintSpareChild = (spareRecord) => {
    const childEntries = getSpareChildEntries(spareRecord)
    if (childEntries.length === 0) return
    const printWindow = window.open('', '_blank', 'width=950,height=750')
    printWindow.document.write(`
      <html>
        <head>
          <title>Spare Job Child Entries - ${spareRecord.serviceJobNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0097A7; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { margin: 0; color: #0097A7; font-size: 20px; text-transform: uppercase; font-weight: 800; }
            p { margin: 3px 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #0097A7; color: white; font-size: 10px; text-transform: uppercase; font-weight: bold; padding: 8px 6px; border: 1px solid #0097A7; text-align: left; }
            td { padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 11px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Spare Job Child Entries</h1>
              <p>Service Job No: <b>${spareRecord.serviceJobNo}</b></p>
              <p>Customer: ${spareRecord.customerName} (${spareRecord.customerCode || 'N/A'})</p>
            </div>
            <div style="text-align: right;">
              <p>Vehicle Model: ${spareRecord.vehicleModelNo || 'N/A'}</p>
              <p>Date: ${spareRecord.savedDate || 'N/A'}</p>
              <p>Printed: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No</th>
                <th>Part No</th>
                <th>Part Name</th>
                <th style="width: 10%" class="text-center">Faster Qty</th>
                <th style="width: 10%" class="text-center">Issued Qty</th>
                <th style="width: 8%" class="text-center">Unit</th>
                <th style="width: 12%" class="text-right">Rate (₹)</th>
                <th style="width: 15%" class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${childEntries.map((row, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td>${row.partNo}</td>
                  <td>${row.partName}</td>
                  <td class="text-center">${row.fasterQty}</td>
                  <td class="text-center">${row.issuedQty}</td>
                  <td class="text-center">${row.unit}</td>
                  <td class="text-right">${row.rate.toFixed(2)}</td>
                  <td class="text-right">${(row.issuedQty * row.rate).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            VELSON ERP - System Generated Spares Report
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleClear = () => {
    setServiceJobNo('')
    setBookingCustomerCode('')
    setCustomerName('')
    setCustomerCode('')
    setDisplayDate(new Date().toISOString().split('T')[0])
    setLastSavedAssName('')
    setServicePartNo('')
    setVehicleNo('')
    setSerialNo('')
    setVehicleModelNo('')
    setModelSubType('')
    setVehicleName('')
    setStatus('')
    setBomRows([])
    setSelectAllBOM(false)
    setSameFasterQty(false)
    setEditingId(null)
    setSelectedRowId(null)
    setActiveBOMPartNo('')
    setExpandedSpareIds({})
    setExpandedAssemblyIds({})
    setSelectedChildRowKey('')
    setSelectedChildPartNo('')
  }

  const handleExportExcel = () => {
    if (filteredSpares.length === 0) {
      toast.warning('No data to export.')
      return
    }
    const data = filteredSpares.map((s, idx) => ({
      'S.No': idx + 1,
      'Service Job No': s.serviceJobNo,
      'Customer Code': s.customerCode,
      'Customer Name': s.customerName,
      'Vehicle No': s.vehicleNo,
      'Serial No': s.serialNo,
      'Vehicle Model': s.vehicleModelNo,
      'Model Sub Type': s.modelSubType,
      'Vehicle Name': s.vehicleName,
      'Service Part No': s.servicePartNo,
      'Status': s.status,
      'Selected Parts Count': (s.selectedParts || []).length,
      'Total Amount': s.totalAmount,
      'Date': s.savedDate
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ServiceSpares')
    XLSX.writeFile(wb, `service_spare_entry_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel downloaded successfully!')
  }

  const selectedPartsCount = getSelectedParts().length

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-4 py-4">

        {/* Breadcrumb — Dashboard chevron removed */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-3.5 uppercase font-bold tracking-wider">
          <span className="hover:text-[#0097A7] cursor-pointer">Service</span>
          <ChevronRight size={11} />
          <span className="text-[#0097A7]">Service Spare Entry</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Teal Header Banner ── */}
          <div className="flex items-center justify-between bg-[#0097A7] text-white px-4 py-2.5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-sm flex-shrink-0"></span>
              <span className="font-bold text-[13px] uppercase tracking-wider">Service Spare's Entry</span>
            </div>
            {/* Top-right action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider flex items-center gap-1 h-[28px]"
              >
                <FileSpreadsheet size={12} className="text-green-300" /> Excel
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
                className="bg-[#007a87] hover:bg-[#006873] border border-white/20 text-[12px] px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider h-[28px]"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-4">

            {/* ── Upper Form — Three-column layout ── */}
            <div className="grid grid-cols-12 gap-x-6 gap-y-2.5 mb-4 border border-slate-200 rounded-lg p-3 bg-slate-50/30">

              {/* LEFT COLUMN */}
              <div className="col-span-5 space-y-2.5">

                {/* Service Job No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label required>Service Job No :</Label></div>
                  <div className="col-span-7">
                    <Combobox
                      options={serviceJobNoOptions}
                      placeholder="Select Job No..."
                      value={serviceJobNo}
                      onChange={handleServiceJobNoChange}
                    />
                  </div>
                </div>

                {/* Booking Customer Code */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Booking Customer Code :</Label></div>
                  <div className="col-span-7">
                    <Select
                      options={bookingCustomerCodeOptions}
                      placeholder="Select Code..."
                      value={bookingCustomerCode}
                      onChange={e => handleBookingCustomerCodeChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Customer Name */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Customer Name :</Label></div>
                  <div className="col-span-7">
                    <Select
                      options={customerNameOptions}
                      placeholder="Select Name..."
                      value={customerName}
                      onChange={e => handleCustomerNameChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Customer Code */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Customer Code :</Label></div>
                  <div className="col-span-7">
                    <Input value={customerCode} readOnly className='!text-[#0097A7]' />
                  </div>
                </div>

                {/* Date */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Date :</Label></div>
                  <div className="col-span-7">
                    <Input type="date" value={displayDate} onChange={e => setDisplayDate(e.target.value)} />
                  </div>
                </div>

                {/* Last Saved Ass. Name */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Last Saved Ass. Name :</Label></div>
                  <div className="col-span-7">
                    <Input value={lastSavedAssName} readOnly className="text-slate-400 italic" placeholder="—" />
                  </div>
                </div>

                {/* Service Part No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Service Part No :</Label></div>
                  <div className="col-span-7">
                    <Select
                      options={servicePartNoOptions}
                      placeholder="Select Part No..."
                      value={servicePartNo}
                      onChange={e => setServicePartNo(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              {/* MIDDLE COLUMN */}
              <div className="col-span-4 space-y-2.5 border-l border-slate-200 pl-4">

                {/* Vehicle No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Vehicle No :</Label></div>
                  <div className="col-span-7">
                    <Input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="Auto-filled" />
                  </div>
                </div>

                {/* Serial No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Serial No :</Label></div>
                  <div className="col-span-7">
                    <Input value={serialNo} onChange={e => setSerialNo(e.target.value)} placeholder="Auto-filled" />
                  </div>
                </div>

                {/* Vehicle Model No */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Vehicle Model No :</Label></div>
                  <div className="col-span-7">
                    <Select
                      options={['VEDC', 'V2I', 'V3', 'V7', 'V10', 'CORE DRILL']}
                      placeholder="Select Model..."
                      value={vehicleModelNo}
                      onChange={e => setVehicleModelNo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Model Sub Type */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Model Sub Type :</Label></div>
                  <div className="col-span-7">
                    <Input value={modelSubType} readOnly placeholder="Auto-filled" />
                  </div>
                </div>

                {/* Vehicle Name */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Vehicle Name :</Label></div>
                  <div className="col-span-7">
                    <Input value={vehicleName} readOnly placeholder="Auto-filled" />
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-left pr-1"><Label>Status :</Label></div>
                  <div className="col-span-7">
                    <Input value={status} readOnly placeholder="Auto-filled" />
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN — Part Image placeholder & Actions */}
              <div className="col-span-3 border-l border-slate-200 pl-4 flex flex-col items-center justify-start pt-1">
                <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Part Image</div>
                {selectedItemForImage && (selectedItemForImage.hasImage || selectedItemForImage.imagePath || selectedItemForImage.imageMimeType) ? (
                  <div className="w-full h-[180px] border border-slate-200 rounded-lg bg-white overflow-hidden flex items-center justify-center shadow-inner relative group">
                    <AuthenticatedImage
                      src={`/api/item-master/${selectedItemForImage.id}/download-image`}
                      alt={selectedItemForImage.partName || 'Selected Part'}
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="w-full h-[180px] border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#0097A7] hover:bg-[#0097A7]/5 transition-all group">
                    <Image size={28} className="text-slate-300 group-hover:text-[#0097A7] transition-colors" />
                    <span className="text-[12px] text-slate-300 group-hover:text-[#0097A7] transition-colors font-bold uppercase">No Image</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 w-full mt-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-sm h-[32px] transition-all active:scale-95 w-full"
                  >
                    <Save size={12} /> {editingId !== null ? 'Update' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedRowId) {
                        const row = sparesList.find(s => s.id === selectedRowId)
                        if (row) handleEditRow(row)
                      } else {
                        toast.warning('Please select a row to edit.')
                      }
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold rounded shadow-sm h-[32px] transition-all active:scale-95 w-full"
                  >
                    <Edit size={12} className="text-[#0097A7]" /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold rounded shadow-sm h-[32px] transition-all active:scale-95 w-full"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                  <button
                    onClick={handleClear}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold rounded shadow-sm h-[32px] transition-all active:scale-95 w-full"
                  >
                    <RotateCcw size={12} className="text-[#0097A7]" /> Clear
                  </button>
                </div>
              </div>
            </div>

            {/* ── BOM List Section ── */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 bg-white shadow-sm">

              {/* BOM Header toggles */}
              <div className="flex items-center gap-6 px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => handleSelectAllBOM(!selectAllBOM)}>
                  <input
                    type="checkbox"
                    checked={selectAllBOM}
                    onChange={e => handleSelectAllBOM(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#0097A7] border-slate-300 rounded focus:ring-[#0097A7] cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="text-[12.5px] font-bold text-slate-600 uppercase tracking-wider">Select All</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setSameFasterQty(v => !v)}>
                  <input
                    type="checkbox"
                    checked={sameFasterQty}
                    onChange={e => setSameFasterQty(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#0097A7] border-slate-300 rounded focus:ring-[#0097A7] cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="text-[12.5px] font-bold text-slate-600 uppercase tracking-wider">Same Faster Qty to Issued Qty</span>
                </div>
                <span className="ml-auto text-[12px] font-bold text-[#0097A7] uppercase tracking-wider">BOM List</span>
              </div>

              {/* BOM Table */}
              <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[860px]">
                  <thead className="bg-slate-50 text-[12px] uppercase text-slate-400 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr className="h-8">
                      <th className="px-2.5 py-1 border-r border-slate-100 w-12 text-center"></th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-14 text-center">S.No</th>
                      <th className="px-2.5 py-1 border-r border-slate-100 w-48">Assembly Part No</th>
                      <th className="px-2.5 py-1 border-r border-slate-100">Assembly Name</th>
                      <th className="px-2.5 py-1 w-32">Model</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12.5px] text-slate-600">
                    {bomRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-300 italic">No assembly parts found for this job.</td>
                      </tr>
                    ) : (
                      bomRows.map((assembly, idx) => {
                        const isExpanded = !!expandedAssemblyIds[assembly.id];
                        const rows = [
                          <tr
                            key={`parent-${assembly.id}`}
                            className={`hover:bg-[#0097A7]/5 cursor-pointer h-9 transition-colors font-semibold ${isExpanded ? 'bg-slate-50/80 border-l-2 border-[#0097A7]' : ''}`}
                            onClick={() => {
                              setExpandedAssemblyIds(prev => ({
                                ...prev,
                                [assembly.id]: !prev[assembly.id]
                              }));
                            }}
                          >
                            <td className="px-2.5 py-1 border-r border-slate-50 text-center" onClick={(e) => {
                              e.stopPropagation();
                              setExpandedAssemblyIds(prev => ({
                                ...prev,
                                [assembly.id]: !prev[assembly.id]
                              }));
                            }}>
                              <button className="p-1 rounded bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-all flex items-center justify-center mx-auto">
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </button>
                            </td>
                            <td className="px-2.5 py-1 border-r border-slate-50 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-2.5 py-1 border-r border-slate-50 font-mono text-[11px] text-slate-500">{assembly.assemblyPartNo}</td>
                            <td className="px-2.5 py-1 border-r border-slate-50 text-slate-700">{assembly.groupName}</td>
                            <td className="px-2.5 py-1 text-slate-500 font-bold">{assembly.model}</td>
                          </tr>
                        ];

                        if (isExpanded) {
                          rows.push(
                            <tr key={`child-table-${assembly.id}`} className="bg-slate-50/70 hover:bg-slate-50/70">
                              <td colSpan={5} className="px-4 py-2 border-b border-slate-200">
                                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-[12px]">
                                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200">
                                      <tr>
                                        <th className="px-3 py-1.5 border-r border-slate-100 w-14 text-center">Select</th>
                                        <th className="px-3 py-1.5 border-r border-slate-100 w-14 text-center">S.No</th>
                                        <th className="px-3 py-1.5 border-r border-slate-100 w-36">Part No</th>
                                        <th className="px-3 py-1.5 border-r border-slate-100">Part Name</th>
                                        <th className="px-3 py-1.5 border-r border-slate-100 w-24 text-center">Faster Qty</th>
                                        <th className="px-3 py-1.5 border-r border-slate-100 w-24 text-center">Issued Qty</th>
                                        <th className="px-3 py-1.5 border-r border-slate-100 w-16 text-center">Unit</th>
                                        <th className="px-3 py-1.5 border-r border-slate-100 w-24 text-right">Rate (₹)</th>
                                        <th className="px-3 py-1.5 w-28 text-right">Amount (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {assembly.parts.length === 0 ? (
                                        <tr>
                                          <td colSpan={9} className="px-3 py-4 text-center text-slate-400 italic">
                                            No child parts uploaded/configured for this assembly.
                                          </td>
                                        </tr>
                                      ) : (
                                        assembly.parts.map((partRow, partIdx) => {
                                          const isPartSelected = partRow.selected;
                                          const isPartActive = activeBOMPartNo === partRow.partNo;
                                          return (
                                            <tr
                                              key={partRow.id}
                                              onClick={() => {
                                                handleBOMRowSelect(partRow.id);
                                                setActiveBOMPartNo(partRow.partNo);
                                              }}
                                              className={`cursor-pointer transition-colors ${isPartSelected || isPartActive
                                                ? 'bg-[#0097A7]/10 font-semibold'
                                                : 'hover:bg-[#0097A7]/5'
                                                }`}
                                            >
                                              <td className="px-3 py-1.5 border-r border-slate-50 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                  type="checkbox"
                                                  checked={partRow.selected}
                                                  onChange={() => {
                                                    handleBOMRowSelect(partRow.id);
                                                    setActiveBOMPartNo(partRow.partNo);
                                                  }}
                                                  className="w-3.5 h-3.5 text-[#0097A7] border-slate-300 rounded cursor-pointer"
                                                />
                                              </td>
                                              <td className="px-3 py-1.5 border-r border-slate-50 text-center text-slate-400 font-bold">{partIdx + 1}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-50 font-mono text-[11px] text-slate-500">{partRow.partNo}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-50 text-slate-700">{partRow.partName}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-50 text-center font-bold text-slate-500">{partRow.fasterQty}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-50 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex flex-col items-center justify-center">
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    value={partRow.issuedQty}
                                                    placeholder="0"
                                                    onChange={(e) => handleIssuedQtyChange(partRow.id, e.target.value)}
                                                    className={`w-16 text-center px-1 py-0.5 text-[12px] h-[22px] border rounded focus:outline-none focus:ring-1 bg-white ${partRow.issuedQty > partRow.fasterQty
                                                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                                                      : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
                                                      }`}
                                                  />
                                                  {partRow.issuedQty > partRow.fasterQty && (
                                                    <span className="text-[9px] text-red-500 font-bold mt-0.5 leading-none whitespace-nowrap">
                                                      Exceeds Qty!
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-3 py-1.5 border-r border-slate-50 text-center text-slate-500">{partRow.unit}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-50 text-right text-slate-600">
                                                {(partRow.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                              </td>
                                              <td className="px-3 py-1.5 text-right font-bold text-[#0097A7]">
                                                {((partRow.issuedQty * partRow.rate) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return rows;
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* BOM Footer summary */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{selectedPartsCount} Part(s) Selected</span>
              </div>
            </div>

            {/* ── Mid-Form Action Toolbar ── */}
            <div className="flex flex-wrap items-center justify-between border border-slate-200 py-1.5 mb-4 bg-slate-50/50 px-3 rounded-lg shadow-sm gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search saved spare entries..."
                    className="pl-8 pr-2 py-1 text-[13px] h-[32px] border border-slate-300 rounded w-64 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7]"
                  />
                  <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
                    <Search size={13} />
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="flex items-center gap-1 px-3 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-sm h-[32px] transition-all active:scale-95"
                >
                  <Search size={12} /> Search
                </button>
                {(searchText || searchQuery) && (
                  <button
                    onClick={() => {
                      setSearchText('')
                      setSearchQuery('')
                    }}
                    className="text-xs text-slate-400 hover:text-[#0097A7] font-bold uppercase"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* ── Bottom Saved Spares Registry Table ── */}
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white mb-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead className="bg-slate-50 text-[12px] uppercase text-slate-400 font-bold border-b border-slate-200">
                    <tr className="h-8">
                      <th className="px-3 py-1 border-r border-slate-100 w-12 text-center"></th>
                      <th className="px-3 py-1 border-r border-slate-100 w-14 text-center">S.No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-36">Service Job No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28">Customer Code</th>
                      <th className="px-3 py-1 border-r border-slate-100">Customer Name</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28">Vehicle No</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-24">Model</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-24 text-center">Parts Qty</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-28 text-right">Total (₹)</th>
                      <th className="px-3 py-1 border-r border-slate-100 w-24">Status</th>
                      <th className="px-3 py-1 w-24 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12.5px]">
                    {filteredSpares.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-slate-300 italic">No spare entries saved.</td>
                      </tr>
                    ) : (
                      filteredSpares.map((row, idx) => {
                        const isExpanded = !!expandedSpareIds[row.id]
                        const rows = [
                          <tr
                            key={`main-${row.id}`}
                            onClick={() => setSelectedRowId(row.id)}
                            className={`hover:bg-[#0097A7]/5 cursor-pointer h-9 transition-colors ${selectedRowId === row.id ? 'bg-[#0097A7]/10 font-semibold' : ''}`}
                          >
                            <td className="px-3 py-1 border-r border-slate-50 text-center" onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSpareIds(prev => ({
                                ...prev,
                                [row.id]: !prev[row.id]
                              }));
                            }}>
                              <button className="p-1 rounded bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-all flex items-center justify-center mx-auto">
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </button>
                            </td>
                            <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-1 border-r border-slate-50 font-bold text-[#0097A7]">{row.serviceJobNo}</td>
                            <td className="px-3 py-1 border-r border-slate-50 text-slate-500">{row.customerCode}</td>
                            <td className="px-3 py-1 border-r border-slate-50 font-bold text-slate-700">{row.customerName}</td>
                            <td className="px-3 py-1 border-r border-slate-50 font-mono text-slate-600">{row.vehicleNo}</td>
                            <td className="px-3 py-1 border-r border-slate-50 text-slate-500 font-bold">{row.vehicleModelNo}</td>
                            <td className="px-3 py-1 border-r border-slate-50 text-center font-bold text-slate-600">{(row.selectedParts || []).length}</td>
                            <td className="px-3 py-1 border-r border-slate-50 text-right font-bold text-[#0097A7]">
                              {(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-1 border-r border-slate-50">
                              <span className={`px-2.5 py-0.5 rounded text-[12px] uppercase font-extrabold ${row.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                row.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                  row.status === 'On Hold' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {row.status || 'Open'}
                              </span>
                            </td>
                            <td className="px-3 py-1 text-center text-slate-500">{row.savedDate}</td>
                          </tr>
                        ];
                        if (isExpanded) {
                          rows.push(
                            <tr key={`expanded-${row.id}`} className="bg-slate-50/70 hover:bg-slate-50/70">
                              <td colSpan={11} className="px-6 py-3 border-b border-slate-200">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                    <h4 className="text-[11.5px] font-bold text-[#0097A7] uppercase tracking-wider">
                                      Child Parts for Spare Entry (Job No: {row.serviceJobNo})
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleExportSpareChildExcel(row);
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[10.5px] font-bold rounded shadow-sm transition-all"
                                        title="Export Excel"
                                      >
                                        <FileSpreadsheet size={12} className="text-green-600" /> Export Excel
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePrintSpareChild(row);
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[10.5px] font-bold rounded shadow-sm transition-all"
                                        title="Print Child Entries"
                                      >
                                        <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print
                                      </button>
                                    </div>
                                  </div>

                                  {(() => {
                                    const childEntries = getSpareChildEntries(row);
                                    if (childEntries.length === 0) {
                                      return (
                                        <div className="text-center text-slate-400 py-4 italic text-[11.5px]">
                                          No child entries selected for this spare entry.
                                        </div>
                                      );
                                    }
                                    return (
                                      <table className="w-full text-left border-collapse text-[12px]">
                                        <thead className="bg-slate-50 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200">
                                          <tr>
                                            <th className="px-3 py-1.5 border-r border-slate-100 w-14 text-center">S.No</th>
                                            <th className="px-3 py-1.5 border-r border-slate-100 w-36">Part No</th>
                                            <th className="px-3 py-1.5 border-r border-slate-100">Part Name</th>
                                            <th className="px-3 py-1.5 border-r border-slate-100 w-24 text-center">Faster Qty</th>
                                            <th className="px-3 py-1.5 border-r border-slate-100 w-24 text-center">Issued Qty</th>
                                            <th className="px-3 py-1.5 border-r border-slate-100 w-16 text-center">Unit</th>
                                            <th className="px-3 py-1.5 border-r border-slate-100 w-24 text-right">Rate (₹)</th>
                                            <th className="px-3 py-1.5 w-28 text-right">Amount (₹)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                          {childEntries.map((childRow, childIdx) => {
                                            const rowKey = `${row.id}-${childIdx}`;
                                            const isChildSelected = selectedChildRowKey === rowKey;
                                            return (
                                              <tr
                                                key={childIdx}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedRowId(row.id);
                                                  setSelectedChildRowKey(isChildSelected ? '' : rowKey);
                                                  setSelectedChildPartNo(isChildSelected ? '' : childRow.partNo);
                                                }}
                                                className={`cursor-pointer transition-colors ${isChildSelected
                                                  ? 'bg-[#0097A7]/10 font-semibold'
                                                  : 'hover:bg-[#0097A7]/5'
                                                  }`}
                                              >
                                                <td className="px-3 py-1.5 border-r border-slate-50 text-center text-slate-400 font-bold">{childIdx + 1}</td>
                                                <td className="px-3 py-1.5 border-r border-slate-50 font-mono text-[11px] text-slate-500">{childRow.partNo}</td>
                                                <td className="px-3 py-1.5 border-r border-slate-50 text-slate-700">{childRow.partName}</td>
                                                <td className="px-3 py-1.5 border-r border-slate-50 text-center text-slate-500">{childRow.fasterQty}</td>
                                                <td className="px-3 py-1.5 border-r border-slate-50 text-center font-bold text-slate-600">{childRow.issuedQty}</td>
                                                <td className="px-3 py-1.5 border-r border-slate-50 text-center text-slate-500">{childRow.unit}</td>
                                                <td className="px-3 py-1.5 border-r border-slate-50 text-right text-slate-600">
                                                  {(childRow.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-bold text-[#0097A7]">
                                                  {((childRow.issuedQty * childRow.rate) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return rows;
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Row Counter */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider shadow-sm">
              <span>Row : {filteredSpares.length}</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}