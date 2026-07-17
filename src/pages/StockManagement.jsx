  import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight, X, Search, FileSpreadsheet, Filter,
  RotateCcw, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Warehouse, Save,ShieldAlert, CheckCircle, PackageOpen, Barcode} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useToast } from '../components/Toast'
import api from '../services/api'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fff', color: '#ff3333', border: '2px solid #ff3333', borderRadius: '8px', margin: '20px' }}>
          <h2 style={{ margin: 0, fontWeight: 'bold' }}>Stock Entry Render Crash:</h2>
          <pre style={{ marginTop: '10px', background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflowX: 'auto', fontSize: '12px' }}>
            {this.state.error?.stack || String(this.state.error)}
          </pre>
          {this.state.info && (
            <pre style={{ marginTop: '10px', background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflowX: 'auto', fontSize: '12px' }}>
              {this.state.info.componentStack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// UI Helper Styling primitives
const inp = (err = '', fullWidth = true) =>
  `${fullWidth ? 'w-full' : ''} border rounded px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 transition-colors bg-white ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
  } text-slate-800`

const lbl = 'text-[11px] font-bold text-slate-500 uppercase tracking-wider'

function StockManagementContent() {
  const toast = useToast()

  // Get the highest barcode number from the adjustments array & localStorage
  const getHighestBarcode = (barcodeType) => {
    let maxNum = 0
    const prefix = barcodeType === 'Multiple' ? 'MM' : 'SM'
    const regex = new RegExp(`${prefix}-(\\d+)`)

    adjustments.forEach(adj => {
      if (adj.barcode) {
        // Find all matches for MM-XXXXX or SM-XXXXX (or older MS-XXXXX) in the barcode string
        const prefixes = prefix === 'SM' ? ['SM', 'MS'] : [prefix]
        prefixes.forEach(pref => {
          const matches = adj.barcode.match(new RegExp(`${pref}-\\d+`, 'g'))
          if (matches) {
            matches.forEach(m => {
              const numMatch = m.match(new RegExp(`${pref}-(\\d+)`))
              if (numMatch) {
                const num = parseInt(numMatch[1], 10)
                if (num > maxNum) maxNum = num
              }
            })
          }
        })
      }
    })

    const localKey = `highest_barcode_${prefix}`
    const localMax = parseInt(localStorage.getItem(localKey), 10)
    if (!isNaN(localMax) && localMax > maxNum) {
      maxNum = localMax
    }

    return maxNum
  }

  // Barcode Generation Helpers
  const getBarcodeLabel = (row) => {
    if (!row) return ''
    const isMultiple = row.barcodeType === 'Multiple'
    const itemKey = String(row.partNo || '').trim().toLowerCase()

    if (!isMultiple) {
      // Find adjustments for this item to get its latest barcode
      const itemAdjs = adjustments.filter(adj =>
        String(adj.partNo || '').trim().toLowerCase() === itemKey &&
        adj.barcodeType === 'Single' &&
        adj.barcode
      )
      if (itemAdjs.length > 0) {
        const sorted = [...itemAdjs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return sorted[0].barcode
      }

      const maxNum = getHighestBarcode('Single')
      const nextIdx = maxNum + 1
      return `SM-${String(nextIdx).padStart(5, '0')}`
    } else {
      // Find active barcodes for this item
      const barcodeQtys = {}
      adjustments.forEach(adj => {
        if (String(adj.partNo || '').trim().toLowerCase() === itemKey && adj.barcodeType === 'Multiple' && adj.barcode) {
          const delta = adj.type === 'INWARD' ? adj.qty : -adj.qty
          barcodeQtys[adj.barcode] = (barcodeQtys[adj.barcode] || 0) + delta
        }
      })

      const activeBarcodes = Object.entries(barcodeQtys)
        .filter(([_, qty]) => qty > 0)
        .map(([barcode]) => barcode)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

      if (activeBarcodes.length === 0) {
        const maxNum = getHighestBarcode('Multiple')
        const nextIdx = maxNum + 1
        return `MM-${String(nextIdx).padStart(5, '0')}`
      }

      if (activeBarcodes.length === 1) {
        return activeBarcodes[0]
      }

      return `${activeBarcodes[0]} ~ ${activeBarcodes[activeBarcodes.length - 1]}`
    }
  }

  const getGeneratedBarcodes = (item) => {
    if (!item) return []
    const isMultiple = item.barcodeType === 'Multiple'
    const itemKey = String(item.partNo || '').trim().toLowerCase()

    const barcodeQtys = {}
    adjustments.forEach(adj => {
      if (String(adj.partNo || '').trim().toLowerCase() === itemKey && adj.barcodeType === (isMultiple ? 'Multiple' : 'Single') && adj.barcode) {
        const delta = adj.type === 'INWARD' ? adj.qty : -adj.qty
        barcodeQtys[adj.barcode] = (barcodeQtys[adj.barcode] || 0) + delta
      }
    })

    const list = []
    Object.entries(barcodeQtys).forEach(([barcode, qty]) => {
      if (qty > 0) {
        list.push({ barcode, qty })
      }
    })

    list.sort((a, b) => a.barcode.localeCompare(b.barcode, undefined, { numeric: true }))

    if (list.length === 0 && item.currentStock > 0) {
      if (!isMultiple) {
        list.push({
          barcode: getBarcodeLabel(item),
          qty: item.currentStock
        })
      } else {
        const qty = Math.floor(item.currentStock)
        const startIdx = item.multipleStartIdx || 1
        for (let i = 0; i < qty; i++) {
          list.push({
            barcode: `MM-${String(startIdx + i).padStart(5, '0')}`,
            qty: 1
          })
        }
        if (item.currentStock > qty) {
          list.push({
            barcode: `MM-${String(startIdx + qty).padStart(5, '0')}`,
            qty: Number((item.currentStock - qty).toFixed(2))
          })
        }
      }
    }
    return list
  }

  // Master Data States
  const [items, setItems] = useState([])
  const [itemGroups, setItemGroups] = useState([])
  const [grns, setGrns] = useState([])
  const [materialIssues, setMaterialIssues] = useState([])
  const [activeTab, setActiveTab] = useState('stock-entry')
  const [loading, setLoading] = useState(true)

  const [adjustments, setAdjustments] = useState([])
  const [stockSearch, setStockSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState({})

  // Filter States
  const [partNoFilter, setPartNoFilter] = useState('')
  const [partNameFilter, setPartNameFilter] = useState('')
  const [qtyFilter, setQtyFilter] = useState('')
  const [uomFilter, setUomFilter] = useState('')
  const [priceFilter, setPriceFilter] = useState('')
  const [amountFilter, setAmountFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [barcodeFilter, setBarcodeFilter] = useState('') // '', 'Single', 'Multiple'

  // Handle auto generation of filters when partNo changes
  const handlePartNoFilterChange = (val) => {
    setPartNoFilter(val)
    if (val) {
      const matched = stockLedger.find(it => it.partNo === val)
      if (matched) {
        setPartNameFilter(matched.partName || '')
        setQtyFilter('')
        setUomFilter(matched.uom || '')
        setPriceFilter(String(matched.purchaseRate || matched.rate || 0))
        setAmountFilter('')
        setBarcodeFilter(matched.barcodeType || 'Single')
      }
    } else {
      setPartNameFilter('')
      setQtyFilter('')
      setUomFilter('')
      setPriceFilter('')
      setAmountFilter('')
      setBarcodeFilter('')
    }
  }

  // Handle Quick Stock Correction from filters
  const handleSaveQuickQty = async () => {
    if (!partNoFilter) return

    const matchedItem = stockLedger.find(it => it.partNo === partNoFilter)
    if (!matchedItem) {
      toast.error('Selected item not found in stock ledger')
      return
    }

    const currentQty = matchedItem.currentStock || 0
    const enteredQty = parseFloat(qtyFilter)

    if (isNaN(enteredQty) || enteredQty === 0) {
      toast.error('Please enter a valid non-zero quantity')
      return
    }

    const targetQty = currentQty + enteredQty
    if (targetQty < 0) {
      toast.error('Adjusted stock quantity cannot be negative')
      return
    }

    const diff = enteredQty
    const type = diff > 0 ? 'INWARD' : 'OUTWARD'
    const absQty = Math.abs(diff)
    const rateVal = matchedItem.purchaseRate || matchedItem.rate || 0
    const uomVal = matchedItem.uom || 'SET'
    const batchTime = new Date().toISOString()

    // Generate the array of adjustments to save
    const adjsToSave = []

    if (matchedItem.barcodeType === 'Multiple') {
      if (type === 'INWARD') {
        const maxNum = getHighestBarcode('Multiple')
        let startIdx = maxNum + 1

        const intQty = Math.floor(absQty)
        for (let i = 0; i < intQty; i++) {
          const currentIdx = startIdx + i
          adjsToSave.push({
            partNo: partNoFilter,
            partName: matchedItem.partName || '',
            qty: 1.0,
            uom: uomVal,
            price: rateVal,
            amount: rateVal,
            barcode: `MM-${String(currentIdx).padStart(5, '0')}`,
            barcodeType: 'Multiple',
            type: 'INWARD',
            remarks: 'Manual stock correction (quick edit from filters)',
            createdAt: batchTime
          })
        }
        if (absQty > intQty) {
          const currentIdx = startIdx + intQty
          const remQty = Number((absQty - intQty).toFixed(2))
          adjsToSave.push({
            partNo: partNoFilter,
            partName: matchedItem.partName || '',
            qty: remQty,
            uom: uomVal,
            price: rateVal,
            amount: Number((remQty * rateVal).toFixed(2)),
            barcode: `MM-${String(currentIdx).padStart(5, '0')}`,
            barcodeType: 'Multiple',
            type: 'INWARD',
            remarks: 'Manual stock correction (quick edit from filters)',
            createdAt: batchTime
          })
        }

        const totalGeneratedCount = Math.ceil(absQty)
        const lastGeneratedIdx = startIdx + totalGeneratedCount - 1
        localStorage.setItem('highest_barcode_MM', String(lastGeneratedIdx))
      } else {
        // OUTWARD - deduct existing available barcodes for this item
        const itemBarcodeMap = {}
        adjustments.forEach(adj => {
          if (adj.partNo === partNoFilter && adj.barcodeType === 'Multiple' && adj.barcode) {
            const delta = adj.type === 'INWARD' ? adj.qty : -adj.qty
            itemBarcodeMap[adj.barcode] = (itemBarcodeMap[adj.barcode] || 0) + delta
          }
        })
        const availableBarcodes = []
        for (const [bc, q] of Object.entries(itemBarcodeMap)) {
          if (q >= 1) {
            for (let j = 0; j < Math.floor(q); j++) availableBarcodes.push(bc)
          } else if (q > 0) {
            availableBarcodes.push(bc)
          }
        }
        availableBarcodes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

        const intQty = Math.floor(absQty)
        for (let i = 0; i < intQty; i++) {
          const outBc = availableBarcodes.length > 0 ? availableBarcodes.pop() : 'MM-00000'
          adjsToSave.push({
            partNo: partNoFilter,
            partName: matchedItem.partName || '',
            qty: 1.0,
            uom: uomVal,
            price: rateVal,
            amount: rateVal,
            barcode: outBc,
            barcodeType: 'Multiple',
            type: 'OUTWARD',
            remarks: 'Manual stock correction (quick edit from filters)',
            createdAt: batchTime
          })
        }
        if (absQty > intQty) {
          const outBc = availableBarcodes.length > 0 ? availableBarcodes.pop() : 'MM-00000'
          const remQty = Number((absQty - intQty).toFixed(2))
          adjsToSave.push({
            partNo: partNoFilter,
            partName: matchedItem.partName || '',
            qty: remQty,
            uom: uomVal,
            price: rateVal,
            amount: Number((remQty * rateVal).toFixed(2)),
            barcode: outBc,
            barcodeType: 'Multiple',
            type: 'OUTWARD',
            remarks: 'Manual stock correction (quick edit from filters)',
            createdAt: batchTime
          })
        }
      }
    } else {
      // Single barcode
      let barcodeLabel = ''
      if (type === 'INWARD') {
        const maxNum = getHighestBarcode('Single')
        const nextIdx = maxNum + 1
        barcodeLabel = `SM-${String(nextIdx).padStart(5, '0')}`
        localStorage.setItem('highest_barcode_SM', String(nextIdx))
      } else {
        // OUTWARD: find the existing single barcode for this item to deduct from it
        const existingSingle = adjustments.find(adj => adj.partNo === partNoFilter && adj.barcodeType === 'Single' && adj.barcode)
        barcodeLabel = existingSingle ? existingSingle.barcode : 'SM-00000'
      }

      adjsToSave.push({
        partNo: partNoFilter,
        partName: matchedItem.partName || '',
        qty: absQty,
        uom: uomVal,
        price: rateVal,
        amount: Number((absQty * rateVal).toFixed(2)),
        barcode: barcodeLabel,
        barcodeType: 'Single',
        type,
        remarks: 'Manual stock correction (quick edit from filters)',
        createdAt: batchTime
      })
    }

    try {
      await api.post('/api/stock-adjustment', adjsToSave, {
        loadingMessage: 'Saving stock entries...'
      })
      toast.success(`Stock for ${partNoFilter} updated successfully to ${targetQty}!`)
      await fetchAllData()
      setPartNoFilter('')
      setPartNameFilter('')
      setQtyFilter('')
      setUomFilter('')
      setPriceFilter('')
      setAmountFilter('')
      setGroupFilter('')
      setBarcodeFilter('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save stock entries to database')
    }
  }

  // Drawer / Detail View State
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Handle Delete Stock Entry
  const handleDeleteStockEntry = async (row, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this stock entry? This action cannot be undone.')) return;

    const idsToDelete = row.detailsList ? row.detailsList.map(item => item.id) : [row.id];

    try {
      await api.post('/api/stock-adjustment/delete', { ids: idsToDelete }, {
        loadingMessage: 'Deleting stock entry...'
      });
      toast.success('Stock entry deleted successfully!');
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete stock entry');
    }
  };

  const handleDeleteSingleBarcode = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this barcode? This action cannot be undone.')) return;

    try {
      await api.post('/api/stock-adjustment/delete', { ids: [id] }, {
        loadingMessage: 'Deleting barcode...'
      });
      toast.success('Barcode deleted successfully!');
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete barcode');
    }
  };



  // Load Data from APIs
  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [itemsRes, groupsRes, adjustmentsRes, grnsRes, materialIssuesRes] = await Promise.all([
        api.get('/api/item-master?limit=100000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/item-group-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/stock-adjustment', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/grn-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/material-issue', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => [])
      ])

      setItems(itemsRes.filter(item => item.barcodeType))
      setItemGroups(groupsRes)
      setGrns(grnsRes)
      setAdjustments(adjustmentsRes)
      setMaterialIssues(materialIssuesRes)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Live Stock Calculation Engine
  const stockLedger = useMemo(() => {
    // 1. Group GRN entries by item code
    const grnInward = {}
    grns.forEach(grn => {
      if (Array.isArray(grn.details)) {
        grn.details.forEach(det => {
          const code = String(det.itemCode || '').trim().toLowerCase()
          if (code) {
            grnInward[code] = (grnInward[code] || 0) + (det.qty || 0)
          }
        })
      }
    })

    // 2. Group Material Issue entries by part no
    const issueOutward = {}
    materialIssues.forEach(issue => {
      if (Array.isArray(issue.items)) {
        issue.items.forEach(det => {
          const code = String(det.partNo || '').trim().toLowerCase()
          if (code) {
            issueOutward[code] = (issueOutward[code] || 0) + (det.qty || 0)
          }
        })
      }
    })

    // 3. Group manual adjustments by part no
    const adjustmentBalance = {}
    const adjustmentBarcodeTypes = {}
    adjustments.forEach(adj => {
      const code = String(adj.partNo || '').trim().toLowerCase()
      if (code) {
        const delta = adj.type === 'INWARD' ? (adj.qty || 0) : -(adj.qty || 0)
        adjustmentBalance[code] = (adjustmentBalance[code] || 0) + delta
        if (adj.barcodeType) {
          adjustmentBarcodeTypes[code] = adj.barcodeType
        }
      }
    })

    // 4. Combine everything for each item master record
    let multipleBarcodeCount = 0
    return items.map(item => {
      const codeKey = String(item.partNo || '').trim().toLowerCase()
      const inward = grnInward[codeKey] || 0
      const outward = issueOutward[codeKey] || 0
      const adjVal = adjustmentBalance[codeKey] || 0
      const currentStock = Math.max(0, inward + adjVal - outward)

      // Determine stock status status
      let status = 'Normal'
      const minVal = item.minStock || 0
      if (currentStock <= 0) {
        status = 'Out of Stock'
      } else if (currentStock <= minVal) {
        status = 'Low Stock'
      }

      // Find matching group name
      const groupObj = itemGroups.find(g => g.id === item.groupId)
      const groupName = groupObj ? groupObj.groupName : 'General'

      const barcodeType = item.barcodeType || adjustmentBarcodeTypes[codeKey] || 'Single'

      let multipleStartIdx = 0
      if (barcodeType === 'Multiple') {
        const itemAdjs = adjustments.filter(adj =>
          String(adj.partNo || '').trim().toLowerCase() === codeKey &&
          adj.barcodeType === 'Multiple' &&
          adj.barcode
        )
        if (itemAdjs.length > 0) {
          let minNum = Infinity
          itemAdjs.forEach(adj => {
            const match = adj.barcode.match(/MM-(\d+)/)
            if (match) {
              const num = parseInt(match[1], 10)
              if (num < minNum) {
                minNum = num
              }
            }
          })
          multipleStartIdx = minNum === Infinity ? 1 : minNum
        } else {
          // If no item barcodes, find global max to predict next barcode correctly
          const maxNum = getHighestBarcode('Multiple')
          multipleStartIdx = maxNum > 0 ? maxNum + 1 : 1
        }
      }

      return {
        ...item,
        groupName,
        inwardQty: inward,
        outwardQty: outward,
        adjQty: adjVal,
        currentStock,
        stockValue: currentStock * (item.purchaseRate || item.rate || 0),
        status,
        barcodeType,
        multipleStartIdx
      }
    })
  }, [items, itemGroups, grns, materialIssues, adjustments])

  // Filtered Stock Ledger
  const filteredLedger = useMemo(() => {
    return stockLedger.filter(item => {
      // Individual Filter Matches
      const matchesPartNo = !partNoFilter || item.partNo === partNoFilter
      const matchesPartName = !partNameFilter || String(item.partName || '').toLowerCase().includes(partNameFilter.toLowerCase())
      // Only filter by Qty, Price, or Amount if partNoFilter is NOT selected (i.e. performing a general query)
      const matchesQty = !partNoFilter ? (!qtyFilter || String(item.currentStock || 0) === qtyFilter) : true
      const matchesUom = !uomFilter || String(item.uom || '').toLowerCase() === uomFilter.toLowerCase()
      const matchesPrice = !partNoFilter ? (!priceFilter || String(item.purchaseRate || item.rate || 0) === priceFilter) : true
      const matchesAmount = !partNoFilter ? (!amountFilter || String(item.stockValue || 0) === amountFilter) : true

      // Group Match
      const matchesGroup = !groupFilter || item.groupName === groupFilter

      // Barcode Match
      const matchesBarcode = !barcodeFilter || (item.barcodeType || 'Single') === barcodeFilter

      return matchesPartNo && matchesPartName && matchesQty && matchesUom && matchesPrice && matchesAmount && matchesGroup && matchesBarcode
    })
  }, [stockLedger, partNoFilter, partNameFilter, qtyFilter, uomFilter, priceFilter, amountFilter, groupFilter, barcodeFilter])

  // Flattened Stock Ledger for displaying Multiple barcodes one by one
  const flattenedLedger = useMemo(() => {
    const list = []
    filteredLedger.forEach(item => {
      let displayQty = item.currentStock
      if (partNoFilter && qtyFilter) {
        const parsed = parseFloat(qtyFilter)
        if (!isNaN(parsed)) {
          displayQty = Math.max(0, item.currentStock + parsed)
        }
      }

      const barcodeLabel = getBarcodeLabel({ ...item, currentStock: displayQty })
      list.push({
        ...item,
        rowKey: `${item.id}-row`,
        hasBarcodeYesNo: item.barcodeType ? 'Yes' : 'No',
        displayBarcode: barcodeLabel,
        displayQty: displayQty,
        displayStockValue: displayQty * (item.purchaseRate || item.rate || 0)
      })
    })
    return list
  }, [filteredLedger, partNoFilter, qtyFilter])



  // Get Inward Transaction History for Selected Item
  const selectedItemInwardHistory = useMemo(() => {
    if (!selectedItem) return []
    const itemKey = selectedItem.partNo.trim().toLowerCase()
    const history = []

    grns.forEach(grn => {
      if (Array.isArray(grn.details)) {
        grn.details.forEach(det => {
          if (String(det.itemCode || '').trim().toLowerCase() === itemKey) {
            history.push({
              date: grn.grnDate ? new Date(grn.grnDate).toLocaleDateString() : '—',
              docNo: grn.grnNo,
              entity: grn.supplierName || '—',
              qty: det.qty,
              price: det.unitPrice || 0,
              type: 'GRN Inward'
            })
          }
        })
      }
    })

    // Add manual inward adjustments
    adjustments.forEach(adj => {
      if (String(adj.partNo || '').trim().toLowerCase() === itemKey && adj.type === 'INWARD') {
        history.push({
          date: new Date(adj.date).toLocaleDateString(),
          docNo: 'MANUAL-ADJ',
          entity: adj.remarks || 'Stock Adjustment',
          qty: adj.qty,
          price: adj.unitPrice || 0,
          type: 'Manual Inward'
        })
      }
    })

    return history.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [selectedItem, grns, adjustments])

  // Get Outward Transaction History for Selected Item
  const selectedItemOutwardHistory = useMemo(() => {
    if (!selectedItem) return []
    const itemKey = selectedItem.partNo.trim().toLowerCase()
    const history = []

    materialIssues.forEach(issue => {
      if (Array.isArray(issue.items)) {
        issue.items.forEach(det => {
          if (String(det.partNo || '').trim().toLowerCase() === itemKey) {
            history.push({
              date: issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : '—',
              docNo: issue.issueNo,
              entity: issue.department || '—',
              qty: det.qty,
              price: det.rate || 0,
              type: 'Material Issue'
            })
          }
        })
      }
    })

    // Add manual outward adjustments
    adjustments.forEach(adj => {
      if (String(adj.partNo || '').trim().toLowerCase() === itemKey && adj.type === 'OUTWARD') {
        history.push({
          date: new Date(adj.date).toLocaleDateString(),
          docNo: 'MANUAL-ADJ',
          entity: adj.remarks || 'Stock Adjustment',
          qty: adj.qty,
          price: adj.unitPrice || 0,
          type: 'Manual Outward'
        })
      }
    })

    return history.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [selectedItem, materialIssues, adjustments])



  // Handle Excel Export
  const handleExportExcel = () => {
    if (flattenedLedger.length === 0) {
      toast.error('No stock records to export')
      return
    }

    const dataToExport = flattenedLedger.map((row, idx) => ({
      'Sno': idx + 1,
      'Barcode': row.displayBarcode,
      'Part Number': row.partNo || '',
      'Qty': row.displayQty,
      'UOM': row.uom || '—',
      'Price': row.purchaseRate || row.rate || 0,
      'Amount': row.displayStockValue
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Current Stock Ledger')
    const workbookBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const workbookBlob = new Blob([workbookBuffer], { type: 'application/octet-stream' })
    openExcelPreview(dataToExport, workbookBlob, 'Stock_Management_Ledger.xlsx', 'Stock Ledger Preview')
    toast.success('Excel export completed!')
  }

  // Render Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Out of Stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
            <ShieldAlert size={11} /> Out of Stock
          </span>
        )
      case 'Low Stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
            <AlertTriangle size={11} /> Low Stock
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle size={11} /> Normal
          </span>
        )
    }
  }



  const filteredStockReport = useMemo(() => {
    // 1. Filter raw adjustments based on stockSearch
    const filtered = adjustments.filter(adj => {
      if (!stockSearch.trim()) return true
      const q = stockSearch.toLowerCase()
      return (
        String(adj.barcode || '').toLowerCase().includes(q) ||
        String(adj.partNo || '').toLowerCase().includes(q) ||
        String(adj.partName || '').toLowerCase().includes(q) ||
        String(adj.barcodeType || '').toLowerCase().includes(q)
      )
    })

    // 2. Separate Single and Multiple
    const singles = filtered.filter(adj => adj.barcodeType !== 'Multiple')
    const multiples = filtered.filter(adj => adj.barcodeType === 'Multiple')

    // 3. Keep singles as individual rows (so each manual adjustment with its unique barcode is visible)
    const groupedSingles = []
    const sortedSingles = [...singles].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    sortedSingles.forEach(item => {
      groupedSingles.push({
        id: item.id || Math.random().toString(),
        partNo: item.partNo,
        partName: item.partName,
        barcodeType: item.barcodeType || 'Single',
        type: item.type,
        uom: item.uom,
        price: item.price,
        qty: item.qty,
        amount: item.amount,
        createdAt: item.createdAt,
        barcode: item.barcode || '—',
        detailsList: [item]
      })
    })

    // 4. Group multiples by partNo AND createdAt date (so different-day entries are separate rows)
    const groupedMultiples = []

    // Sort multiples by createdAt so we group sequentially/chronologically
    const sortedMultiples = [...multiples].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    sortedMultiples.forEach(item => {
      // Find an existing group by partNo AND same date
      const itemDate = new Date(item.createdAt).toLocaleDateString('en-GB')
      const match = groupedMultiples.find(g => {
        const gDate = new Date(g.createdAt).toLocaleDateString('en-GB')
        return g.partNo === item.partNo && gDate === itemDate
      })

      const netQty = item.type === 'OUTWARD' ? -item.qty : item.qty
      const netAmount = item.type === 'OUTWARD' ? -item.amount : item.amount

      if (match) {
        match.qty += netQty
        match.amount += netAmount
        if (item.barcode && !match.barcodesList.includes(item.barcode)) {
          match.barcodesList.push(item.barcode)
        }
        match.detailsList.push(item)
      } else {
        groupedMultiples.push({
          id: item.id || Math.random().toString(),
          partNo: item.partNo,
          partName: item.partName,
          barcodeType: 'Multiple',
          type: 'INWARD',
          uom: item.uom,
          price: item.price,
          qty: netQty,
          amount: netAmount,
          createdAt: item.createdAt,
          barcodesList: item.barcode ? [item.barcode] : [],
          detailsList: [item]
        })
      }
    })

    // Format the barcode range for each group
    groupedMultiples.forEach(g => {
      g.barcodesList.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }))
      g.detailsList.sort((a, b) => String(a.barcode || '').localeCompare(String(b.barcode || ''), undefined, { numeric: true, sensitivity: 'base' }))
      if (g.barcodesList.length > 1) {
        g.barcode = `${g.barcodesList[0]} - ${g.barcodesList[g.barcodesList.length - 1]}`
      } else {
        g.barcode = g.barcodesList[0] || '—'
      }
    })

    // Combine grouped singles and grouped multiples, sort by createdAt (ascending)
    const combined = [
      ...groupedSingles.map(s => ({
        ...s,
        isSingle: true
      })),
      ...groupedMultiples.map(g => ({
        ...g,
        isSingle: false
      }))
    ]

    return combined.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [adjustments, stockSearch])

  const handleExportStockReportExcel = () => {
    if (filteredStockReport.length === 0) {
      toast.warning('No stock adjustments available to export')
      return
    }

    const data = []
    let sNo = 1

    filteredStockReport.forEach((row) => {
      // If it's multiple and has detailsList, expand each entry into its own row
      if (row.barcodeType === 'Multiple' && row.detailsList && row.detailsList.length > 0) {
        row.detailsList.forEach(detail => {
          data.push({
            'S.No': sNo++,
            'Barcode Type': detail.barcodeType || 'Multiple',
            'Barcode': detail.barcode || '—',
            'Stock Created Date': detail.createdAt ? new Date(detail.createdAt).toLocaleDateString('en-GB').split('/').join('-') : '—',
            'Part No': detail.partNo || '—',
            'Part Name': detail.partName || '—',
            'Qty': detail.type === 'OUTWARD' ? -detail.qty : detail.qty,
            'UOM': detail.uom || '—',
            'Price': detail.price || 0,
            'Amount': detail.type === 'OUTWARD' ? -detail.amount : detail.amount
          })
        })
      } else {
        data.push({
          'S.No': sNo++,
          'Barcode Type': row.barcodeType || 'Single',
          'Barcode': row.barcode || '—',
          'Stock Created Date': row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB').split('/').join('-') : '—',
          'Part No': row.partNo || '—',
          'Part Name': row.partName || '—',
          'Qty': row.type === 'OUTWARD' ? -row.qty : row.qty,
          'UOM': row.uom || '—',
          'Price': row.price || 0,
          'Amount': row.type === 'OUTWARD' ? -row.amount : row.amount
        })
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Entry Report')
    const workbookBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const workbookBlob = new Blob([workbookBuffer], { type: 'application/octet-stream' })
    openExcelPreview(data, workbookBlob, `Stock_Entry_Report_${new Date().toISOString().split('T')[0]}.xlsx`, 'Stock Entry Report Preview')
    toast.success('Stock entry report exported to Excel!')
  }

  return (
    <div className="bg-[#f4f6f8] min-h-screen text-slate-800 relative overflow-x-hidden">
      <div className="px-6 py-6 w-full space-y-6">

        {/* Title Block & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-1.5">
              <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Stores</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#0097A7] font-semibold uppercase">Stock Entry</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Warehouse className="text-[#0097A7] w-6 h-6" /> Stock Entry
            </h1>
            <p className="text-[12px] text-slate-500 font-medium">
              Real-time physical inventory monitoring, inward-outward analysis, and valuation.
            </p>
          </div>

          {/* Tab Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab('stock-entry')}
                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'stock-entry'
                  ? 'bg-[#0097A7] text-white shadow'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Stock Ledger
              </button>
              <button
                onClick={() => setActiveTab('stock-report')}
                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'stock-report'
                  ? 'bg-[#0097A7] text-white shadow'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Stock Entry Report
              </button>
            </div>

            {/* Quick Actions (only show when stock-entry or stock-report is active) */}
            {(activeTab === 'stock-entry' || activeTab === 'stock-report') && (
              <div className="flex items-center gap-2.5">
                {activeTab === 'stock-report' && (
                  <button
                    onClick={handleExportStockReportExcel}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-emerald-600 hover:text-emerald-700 text-[12px] font-bold rounded-lg shadow-sm transition-all"
                  >
                    <FileSpreadsheet size={14} /> Export Excel
                  </button>
                )}
                <button
                  onClick={fetchAllData}
                  className="flex items-center justify-center p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-all"
                  title="Refresh Data"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}
          </div>
        </div>


        {activeTab === 'stock-entry' && (
          <>
            {/* Filter Section Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-[#0097A7] text-white px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filter & Search Parameters
                </span>
                <div className="flex items-center gap-3">
                  {partNoFilter && (
                    <button
                      onClick={handleSaveQuickQty}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-[#0097A7] text-[11px] font-black rounded shadow active:scale-95 transition-all"
                    >
                      <Save size={12} /> Save Barcodes & Qty
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPartNoFilter('')
                      setPartNameFilter('')
                      setQtyFilter('')
                      setUomFilter('')
                      setPriceFilter('')
                      setAmountFilter('')
                      setGroupFilter('')
                      setBarcodeFilter('')
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold rounded shadow transition-all active:scale-95"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
              <div className="p-5">
                {/* Grid of separate filter fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4">

                  {/* 1. Part No */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-[12.5px] font-bold text-slate-700 w-28 text-right shrink-0">Part No :</label>
                    <select
                      value={partNoFilter}
                      onChange={e => handlePartNoFilterChange(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-[13px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0097A7] transition-all font-bold"
                    >
                      <option value="">-- All Part Nos --</option>
                      {items.map(it => (
                        <option key={it.id} value={it.partNo}>{it.partNo}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Part Name */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-[12.5px] font-bold text-slate-700 w-28 text-right shrink-0">Part Name :</label>
                    <input
                      type="text"
                      placeholder="Filter Part Name..."
                      value={partNameFilter}
                      onChange={e => setPartNameFilter(e.target.value)}
                      disabled={!!partNoFilter}
                      className={`w-full px-3 py-1.5 border border-slate-300 rounded text-[13px] transition-all ${partNoFilter ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0097A7]'
                        }`}
                    />
                  </div>

                  {/* 4. Qty */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-[12.5px] font-bold text-slate-700 w-28 text-right shrink-0">Qty :</label>
                    <input
                      type="text"
                      placeholder="Filter Qty..."
                      value={qtyFilter}
                      onChange={e => {
                        const val = e.target.value
                        setQtyFilter(val)
                        if (partNoFilter) {
                          const num = parseFloat(val)
                          const price = parseFloat(priceFilter) || 0
                          if (!isNaN(num)) {
                            setAmountFilter(String(Number((num * price).toFixed(2))))
                          } else {
                            setAmountFilter('')
                          }
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-[13px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0097A7] transition-all font-bold"
                    />
                  </div>

                  {/* 5. UOM */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-[12.5px] font-bold text-slate-700 w-28 text-right shrink-0">UOM :</label>
                    <select
                      value={uomFilter}
                      onChange={e => setUomFilter(e.target.value)}
                      disabled={true}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-[13px] uppercase bg-slate-100 text-slate-400 cursor-not-allowed"
                    >
                      <option value="">-- All UOMs --</option>
                      {Array.from(new Set(stockLedger.map(it => it.uom).filter(Boolean))).map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Price */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-[12.5px] font-bold text-slate-700 w-28 text-right shrink-0">Price :</label>
                    <input
                      type="text"
                      placeholder="Filter Price..."
                      value={priceFilter}
                      onChange={e => setPriceFilter(e.target.value)}
                      disabled={!!partNoFilter}
                      className={`w-full px-3 py-1.5 border border-slate-300 rounded text-[13px] transition-all ${partNoFilter ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0097A7]'
                        }`}
                    />
                  </div>

                  {/* 7. Amount */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-[12.5px] font-bold text-slate-700 w-28 text-right shrink-0">Amount :</label>
                    <input
                      type="text"
                      placeholder="Filter Amount..."
                      value={amountFilter}
                      onChange={e => setAmountFilter(e.target.value)}
                      disabled={!!partNoFilter}
                      className={`w-full px-3 py-1.5 border border-slate-300 rounded text-[13px] transition-all ${partNoFilter ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0097A7]'
                        }`}
                    />
                  </div>

                  {/* Barcode Type */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-[12.5px] font-bold text-slate-700 w-28 text-right shrink-0">Barcode Type :</label>
                    <select
                      value={barcodeFilter}
                      onChange={e => setBarcodeFilter(e.target.value)}
                      disabled={true}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-[13px] bg-slate-100 text-slate-400 cursor-not-allowed"
                    >
                      <option value="">-- All Barcodes --</option>
                      <option value="Single">Single</option>
                      <option value="Multiple">Multiple</option>
                    </select>
                  </div>

                  {/* Stock Created Date */}
                  <div className="flex items-center gap-2.5">
                    <label className="text-[12.5px] font-bold text-slate-700 w-28 text-right shrink-0">Stock Created Date :</label>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString('en-GB').split('/').join('-')}
                      disabled={true}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-[13px] bg-slate-100 text-slate-400 cursor-not-allowed font-bold"
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Central Data Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="bg-[#34495e] text-white px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  Stock Ledger Items
                </span>
              </div>
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                  <div className="w-8 h-8 border-2 border-t-transparent border-[#0097A7] rounded-full animate-spin" />
                  <span className="text-[12px] font-bold uppercase tracking-wider">Syncing Inventory Ledger...</span>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-14">S.No</th>
                        <th className="px-4 py-3.5 text-center w-28">Barcode Type</th>
                        <th className="px-4 py-3.5 text-center w-28">Barcode</th>
                        <th className="px-4 py-3.5 text-center w-36">Part No</th>
                        <th className="px-4 py-3.5 text-center">Part Name</th>
                        <th className="px-4 py-3.5 text-center w-28">Qty</th>
                        <th className="px-4 py-3.5 text-center w-24">UOM</th>
                        <th className="px-4 py-3.5 text-center w-28">Price</th>
                        <th className="px-4 py-3.5 text-center w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[12.5px] font-medium text-slate-700">
                      {!partNoFilter ? (
                        <tr>
                          <td colSpan={9} className="py-16 text-center text-slate-400 font-semibold">
                            <Warehouse size={36} className="mx-auto text-slate-300 mb-2" />
                            Please select a Part Number to display stock details.
                          </td>
                        </tr>
                      ) : flattenedLedger.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-16 text-center text-slate-400 italic">
                            <PackageOpen size={36} className="mx-auto text-slate-300 mb-2" />
                            No stock records matching the filters.
                          </td>
                        </tr>
                      ) : (
                        flattenedLedger.map((row, idx) => (
                          <tr
                            key={row.rowKey}
                            className="hover:bg-cyan-50/20 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedItem(row)
                              setIsDrawerOpen(true)
                            }}
                          >
                            <td className="px-4 py-3 text-center text-slate-400 font-bold italic">{idx + 1}</td>
                            <td className="px-4 py-3 text-center">
                              {row.hasBarcodeYesNo === 'Yes' ? (
                                <span className={`px-2 py-0.5 border text-[10px] rounded font-bold uppercase tracking-wider ${row.barcodeType === 'Multiple'
                                  ? 'bg-purple-50 border-purple-200 text-purple-600'
                                  : 'bg-blue-50 border-blue-200 text-blue-600'
                                  }`}>
                                  {row.barcodeType || 'Single'}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.hasBarcodeYesNo === 'Yes' ? (
                                <span className="font-mono text-[10.5px] font-bold text-slate-500">
                                  {row.displayBarcode}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-blue-600 font-bold group-hover:underline">
                              {row.partNo}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.partName}</td>
                            <td className="px-4 py-3 text-center font-black text-slate-900 text-[13.5px]">
                              {row.displayQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-500 font-bold uppercase">{row.uom || '—'}</td>
                            <td className="px-4 py-3 text-center text-slate-500">
                              ₹{(row.purchaseRate || row.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center font-black text-slate-800">
                              ₹{row.displayStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'stock-report' && (
          <div className="space-y-4">
            {/* Search and Action Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-[#0097A7] text-white px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4" /> Search Options
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setStockSearch('')
                      fetchAllData()
                    }}
                    className="flex items-center justify-center p-1 bg-slate-700 hover:bg-slate-800 text-white rounded transition-all"
                    title="Refresh Data"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3 bg-white">
                <label className="text-[13px] font-bold text-slate-700 w-28 text-right shrink-0">Search :</label>
                <div className="relative flex-grow max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search Barcode, Part No, Part Name..."
                    value={stockSearch}
                    onChange={e => setStockSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded text-[13px] focus:outline-none focus:border-[#0097A7] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Central Data Table for Stock Entry Report */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="bg-[#34495e] text-white px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  Stock Entry Report Records
                </span>
              </div>
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                  <div className="w-8 h-8 border-2 border-t-transparent border-[#0097A7] rounded-full animate-spin" />
                  <span className="text-[12px] font-bold uppercase tracking-wider">Syncing Stock Entry Report...</span>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-14">S.No</th>
                        <th className="px-4 py-3.5 text-center w-28">Barcode Type</th>
                        <th className="px-4 py-3.5 text-center w-28">Barcode</th>
                        <th className="px-4 py-3.5 text-center w-36">Stock Created Date</th>
                        <th className="px-4 py-3.5 text-center w-36">Part No</th>
                        <th className="px-4 py-3.5 text-center">Part Name</th>
                        <th className="px-4 py-3.5 text-center w-28">Qty</th>
                        <th className="px-4 py-3.5 text-center w-24">UOM</th>
                        <th className="px-4 py-3.5 text-center w-28">Price</th>
                        <th className="px-4 py-3.5 text-center w-32">Amount</th>
                        {/* <th className="px-4 py-3.5 text-center w-20">Action</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[12.5px] font-medium text-slate-700">
                      {filteredStockReport.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-16 text-center text-slate-400 font-semibold">
                            <Warehouse size={36} className="mx-auto text-slate-300 mb-2" />
                            No stock entry details match the search query.
                          </td>
                        </tr>
                      ) : (
                        filteredStockReport.map((row, idx) => (
                          <React.Fragment key={row.id || idx}>
                            <tr className="hover:bg-slate-50/75 transition-colors group">
                              <td
                                onClick={() => {
                                  if (row.barcodeType === 'Multiple') {
                                    setExpandedRows(prev => ({
                                      ...prev,
                                      [row.id]: !prev[row.id]
                                    }))
                                  }
                                }}
                                className={`px-4 py-3 text-center text-slate-400 font-bold italic select-none ${row.barcodeType === 'Multiple' ? 'cursor-pointer hover:bg-slate-100 hover:text-[#0097A7] transition-all' : ''
                                  }`}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  {row.barcodeType === 'Multiple' && (
                                    <span className="text-[8px] text-[#0097A7] font-bold">
                                      {expandedRows[row.id] ? '▼' : '▶'}
                                    </span>
                                  )}
                                  <span>{idx + 1}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 border text-[10px] rounded font-bold uppercase tracking-wider ${row.barcodeType === 'Multiple'
                                  ? 'bg-purple-50 border-purple-200 text-purple-600'
                                  : 'bg-blue-50 border-blue-200 text-blue-600'
                                  }`}>
                                  {row.barcodeType || 'Single'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-mono text-[10.5px] font-bold text-slate-500">
                                  {row.barcode || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-600">
                                {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB').split('/').join('-') : '—'}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-blue-600">
                                {row.partNo || '—'}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.partName || '—'}</td>
                              <td className="px-4 py-3 text-center font-black text-slate-900 text-[13.5px]">
                                {(row.type === 'OUTWARD' ? -row.qty : row.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500 font-bold uppercase">{row.uom || '—'}</td>
                              <td className="px-4 py-3 text-center text-slate-500">
                                ₹{(row.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-center font-black text-slate-800">
                                ₹{(row.type === 'OUTWARD' ? -row.amount : row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              {/* <td className="px-4 py-3 text-center">
                                <button
                                  onClick={(e) => handleDeleteStockEntry(row, e)}
                                  className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded transition-colors"
                                  title="Delete Entry"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td> */}
                            </tr>
                            {expandedRows[row.id] && row.barcodeType === 'Multiple' && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={11} className="px-6 py-3 border-l-4 border-l-[#0097A7] bg-slate-50/30">
                                  <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm max-w-4xl mx-auto my-1 bg-white">
                                    <table className="w-full text-left text-[11.5px]">
                                      <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                        <tr>
                                          <th className="px-3 py-2 text-center w-12">S.No</th>
                                          <th className="px-3 py-2 text-center w-28">Barcode</th>
                                          <th className="px-3 py-2 text-center w-32">Stock Created Date</th>
                                          <th className="px-3 py-2 text-center w-32">Part No</th>
                                          <th className="px-3 py-2 text-center">Part Name</th>
                                          <th className="px-3 py-2 text-center w-20">Qty</th>
                                          <th className="px-3 py-2 text-center w-16">UOM</th>
                                          <th className="px-3 py-2 text-center w-24">Price</th>
                                          <th className="px-3 py-2 text-center w-28">Amount</th>
                                          {/* <th className="px-3 py-2 text-center w-16">Action</th> */}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                        {row.detailsList.map((item, dIdx) => (
                                          <tr key={item.id || dIdx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-1.5 text-center text-slate-400 font-bold italic">{dIdx + 1}</td>
                                            <td className="px-3 py-1.5 text-center font-mono text-[#0097A7] font-bold">{item.barcode}</td>
                                            <td className="px-3 py-1.5 text-center text-slate-500">
                                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB').split('/').join('-') : '—'}
                                            </td>
                                            <td className="px-3 py-1.5 text-center font-bold text-slate-700">{item.partNo}</td>
                                            <td className="px-3 py-1.5 text-center text-slate-700">{item.partName || '—'}</td>
                                            <td className="px-3 py-1.5 text-center font-black text-slate-900">
                                              {(item.type === 'OUTWARD' ? -item.qty : item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-1.5 text-center font-bold uppercase text-slate-500">{item.uom || '—'}</td>
                                            <td className="px-3 py-1.5 text-center text-slate-500">₹{(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-3 py-1.5 text-center font-black text-slate-800">
                                              ₹{(item.type === 'OUTWARD' ? -item.amount : item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            {/* <td className="px-3 py-1.5 text-center">
                                              <button
                                                onClick={(e) => handleDeleteSingleBarcode(item.id, e)}
                                                className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                                                title="Delete Barcode"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </td> */}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Transaction Details Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out ${isDrawerOpen && selectedItem ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {selectedItem && (
          <div className="h-full flex flex-col justify-between text-slate-700">
            {/* Drawer Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Part Overview</span>
                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <span className="text-blue-600">{selectedItem.partNo}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Item Master Specs */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Part Name</span>
                  <span className="text-[12px] font-bold text-slate-800 text-right max-w-[240px] truncate" title={selectedItem.partName}>
                    {selectedItem.partName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Group</span>
                  <span className="text-[12px] font-bold text-slate-700">{selectedItem.groupName}</span>
                </div>
                {selectedItem.brand && (
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Brand</span>
                    <span className="text-[12px] font-bold text-slate-700">{selectedItem.brand}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Store / Location</span>
                  <span className="text-[12px] font-bold text-slate-700">
                    {selectedItem.location || '—'} / {selectedItem.rackNo || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Min Stock Limit</span>
                  <span className="text-[12px] font-bold text-slate-700">{selectedItem.minStock || 0}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Rate Price</span>
                  <span className="text-[12px] font-bold text-slate-700">
                    ₹{(selectedItem.purchaseRate || selectedItem.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Stock breakdown formula visualizer */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Stock Calculation</h4>
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                  {/* <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                    <span className="text-slate-400 text-[9px] uppercase tracking-wide block mb-1">Inward (GRN)</span>
                    <span className="text-emerald-700 text-sm font-black">+{selectedItem.inwardQty}</span>
                  </div> */}
                  <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                    <span className="text-slate-400 text-[9px] uppercase tracking-wide block mb-1">Adjustments</span>
                    <span className="text-blue-700 text-sm font-black">
                      {selectedItem.adjQty >= 0 ? '+' : ''}{selectedItem.adjQty}
                    </span>
                  </div>
                  <div className="bg-rose-50 rounded-lg p-2.5 border border-rose-100">
                    <span className="text-slate-400 text-[9px] uppercase tracking-wide block mb-1">Outward (Issue)</span>
                    <span className="text-rose-700 text-sm font-black">-{selectedItem.outwardQty}</span>
                  </div>
                  <div className="bg-[#0097A7]/5 rounded-lg p-2.5 border border-[#0097A7]/10">
                    <span className="text-[#0097A7] text-[9px] uppercase tracking-wide block mb-1">Available</span>
                    <span className="text-[#0097A7] text-sm font-black">{selectedItem.currentStock}</span>
                  </div>
                </div>
              </div>

              {/* Inward transaction logs */}
              <div>
                <h4 className="text-[11.5px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 mb-2.5">
                  <ArrowUpRight className="text-emerald-600 w-4 h-4" /> Inward Transaction History ({selectedItemInwardHistory.length})
                </h4>
                <div className="border border-slate-200 bg-white rounded-lg overflow-hidden text-[11.5px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Doc/GRN No</th>
                        <th className="px-3 py-2">Supplier/Remarks</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedItemInwardHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-slate-400 italic">No inward records found</td>
                        </tr>
                      ) : (
                        selectedItemInwardHistory.map((h, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-500">{h.date}</td>
                            <td className="px-3 py-2 font-bold text-slate-700">{h.docNo}</td>
                            <td className="px-3 py-2 truncate max-w-[120px]" title={h.entity}>{h.entity}</td>
                            <td className="px-3 py-2 text-right font-black text-slate-800">+{h.qty}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outward transaction logs */}
              <div>
                <h4 className="text-[11.5px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 mb-2.5">
                  <ArrowDownRight className="text-rose-600 w-4 h-4" /> Outward Transaction History ({selectedItemOutwardHistory.length})
                </h4>
                <div className="border border-slate-200 bg-white rounded-lg overflow-hidden text-[11.5px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Issue/Doc No</th>
                        <th className="px-3 py-2">Dept/Remarks</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedItemOutwardHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-slate-400 italic">No outward records found</td>
                        </tr>
                      ) : (
                        selectedItemOutwardHistory.map((h, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-500">{h.date}</td>
                            <td className="px-3 py-2 font-bold text-slate-700">{h.docNo}</td>
                            <td className="px-3 py-2 truncate max-w-[120px]" title={h.entity}>{h.entity}</td>
                            <td className="px-3 py-2 text-right font-black text-rose-600">-{h.qty}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Barcode Allocation List */}
              <div>
                <h4 className="text-[11.5px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 mb-2.5">
                  <Barcode className="text-[#0097A7] w-4.5 h-4.5" /> Barcode Allocation List ({selectedItem.barcodeType || 'Single'})
                </h4>
                <div className="border border-slate-200 bg-white rounded-lg overflow-hidden text-[11.5px] max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <tr>
                        <th className="px-3 py-2 text-center w-14">S.No</th>
                        <th className="px-3 py-2">Barcode Code</th>
                        <th className="px-3 py-2 text-right">Allocation Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {getGeneratedBarcodes(selectedItem).map((bc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-[#0097A7]">{bc.barcode}</td>
                          <td className="px-3 py-2 text-right font-black text-slate-800">{bc.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>


          </div>
        )}
      </div>

      {/* Backdrop overlay for Drawer */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 transition-opacity"
        />
      )}


    </div>
  )
}

export default function StockManagement() {
  return (
    <ErrorBoundary>
      <StockManagementContent />
    </ErrorBoundary>
  )
}