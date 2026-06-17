import {
  LayoutDashboard, Users, UserCog, Database, Package,
  UserCircle, Wrench, FileText, ShoppingCart, Warehouse,
  Settings, Landmark, LayoutGrid, ShieldAlert, ClipboardList, Truck,
} from 'lucide-react'

// hiddenRoles: roles that CANNOT see this item
// admin sees everything (no restriction)
// staff sees operational pages but NOT user management / system admin / financials
// user sees only dashboard, service, production, nc, maintenance

export const NAV = [
  { id: 'dashboard-top', label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },

  // Admin-only: user management
  { id: 'users',        label: 'Users',        icon: Users,   page: 'Users', hiddenRoles: ['staff', 'user'] },

  {
    id: 'masters', label: 'Masters', icon: Database, hiddenRoles: ['user'],
    children: [
      { id: 'company-master',        label: 'Company Master',                page: 'CompanyMaster' },
      { id: 'employee-master',       label: 'Employee Master',               page: 'EmployeeMaster' },
      { id: 'ledger-group-master',   label: 'Ledger Group Master',           page: 'LedgerGroupMaster' },
      { id: 'machine-master',        label: 'Machine Master',                page: 'MachineMaster' },
      // { id: 'vehicle-service-master',label: 'Vehicle Service Master',        page: 'VehicleServiceMaster' },
      { id: 'contractor-master',     label: 'Contractor Master',             page: 'ContractorMaster' },
      { id: 'process-master',        label: 'Process Master',                page: 'ProcessMaster' },
      { id: 'reference-master',      label: 'Reference Master',              page: 'ReferenceMaster', hiddenRoles: ['staff', 'user'] },
      { id: 'part-usage-list',       label: 'Part Usage List Display',       page: 'PartUsageList' },
      { id: 'qc-check-method',       label: 'QC Check Method Master',        page: 'QCCheckMethod' },
      { id: 'qc-inspection-char',    label: 'QC Inspection Character Master',page: 'QCInspectionChar' },
      { id: 'qc-standard-master',    label: 'QC Standard Master',            page: 'QCStandardMaster' },
      { id: 'auto-po',               label: 'Auto PO',                       page: 'AutoPO' },
      // Admin-only system settings
      { id: 'system-info-master',    label: 'System Info Master',            page: 'SystemInfoMaster', hiddenRoles: ['staff', 'user'] },
      { id: 'db-copy',               label: 'DB Copy',                       page: 'DBCopy',           hiddenRoles: ['staff', 'user'] },
      { id: 'restore-db',            label: 'Restore DB',                    page: 'RestoreDB',        hiddenRoles: ['staff', 'user'] },
    ],
  },
  {
    id: 'item-masters', label: 'Item Masters', icon: Package, hiddenRoles: ['user'],
    children: [
      { id: 'part-number-base', label: 'Part Number Base Master', page: 'PartNumberBase' },
      { id: 'tax-ledger',       label: 'Tax Ledger A/C Master',   page: 'TaxLedger' },
      { id: 'tax-master-menu',  label: 'Tax Master',              page: 'TaxMaster' },
      { id: 'item-group',       label: 'Item Group Master',       page: 'ItemGroup' },
      { id: 'item-master',      label: 'Item Master',             page: 'ItemMaster' },
    ],
  },
  {
    id: 'person-masters', label: 'Person Masters', icon: UserCircle, hiddenRoles: ['user'],
    children: [
      { id: 'supplier-master', label: 'Supplier Master', page: 'SupplierMaster' },
      { id: 'customer-master', label: 'Customer Master', page: 'CustomerMaster' },
    ],
  },
  {
    id: 'service', label: 'Service', icon: Wrench,
    children: [
      { id: 'vehicle-master',              label: 'Vehicle Master',           page: 'VehicleMaster',           hiddenRoles: ['user'] },
      { id: 'booking-entry-new',           label: 'Booking Entry',            page: 'BookingEntryNew' },
      // { id: 'service-quotation',           label: 'Service Quotation',        page: 'ServiceQuotation',        hiddenRoles: ['user'] },
      // { id: 'service-quotation-details',   label: 'Service Quotation Details',page: 'ServiceQuotationDetails', hiddenRoles: ['user'] },
      { id: 'service-details-entry',       label: 'Service Details Entry',    page: 'ServiceDetailsEntry' },
      { id: 'service-details-report',      label: 'Service Details Report',   page: 'ServiceDetailsReport' },
      // { id: 'service-booking-details',     label: 'Service Booking Details',  page: 'ServiceBookingDetails' },
      { id: 'service-spare-entry',         label: 'Service Spare Entry',      page: 'ServiceSpareEntry' },
    ],
  },
  {
    id: 'quotation', label: 'Quotation', icon: FileText, hiddenRoles: ['user'],
    children: [
      { id: 'quotation-entry',   label: 'Quotation Entry',   page: 'QuotationEntry' },
      { id: 'quotation-details', label: 'Quotation Details', page: 'QuotationDetails' },
      // { id: 'proforma-entry',    label: 'Proforma Entry',    page: 'ProformaEntry' },
      // { id: 'proforma-details',  label: 'Proforma Entry Details', page: 'ProformaDetails' },
      { id: 'marketing-log',     label: 'Marketing Log',     page: 'MarketingLog' },
      // { id: 'marketing-report',  label: 'Marketing Log Report', page: 'MarketingReport' },
    ],
  },
  {
    id: 'purchase', label: 'Purchase', icon: ShoppingCart, hiddenRoles: ['user'],
    children: [
      { id: 'purchase-order',         label: 'Purchase Order',         page: 'PurchaseOrderEntry' },
      { id: 'purchase-order-details', label: 'Purchase Order Details', page: 'PurchaseOrderDetails' },
      { id: 'purchase-request',       label: 'Purchase Request',       page: 'PurchaseRequestEntry' },
      { id: 'print-purchase-request', label: 'Print Purchase Request', page: 'PrintPurchaseRequest' },
      // { id: 'print-purchase-order', label: 'Print Purchase Order',  page: 'PrintPurchaseOrder' },
    ],
  },
  {
    id: 'stores', label: 'Stores', icon: Warehouse, hiddenRoles: ['user'],
    children: [
      { id: 'material-request',       label: 'Material Request',       page: 'MaterialRequestEntry' },
      { id: 'print-material-request', label: 'Print Material Request', page: 'PrintMaterialRequest' },
      { id: 'gate-entry',             label: 'Gate Entry',             page: 'GateEntry' },
      { id: 'gate-entry-report',      label: 'Gate Entry Report',      page: 'GateEntryReport' },
      { id: 'grn-entry',              label: 'GRN Entry',              page: 'GRNEntry' },
      { id: 'grn-entry-report',       label: 'GRN Entry Report',       page: 'GRNEntryReport' },
    ],
  },
  {
    // Financial module — admin only
    id: 'account', label: 'Account', icon: Landmark, hiddenRoles: ['staff', 'user'],
    children: [
      { id: 'receipt-entry',              label: 'Receipt Entry',               page: 'ReceiptEntry' },
      { id: 'receipt-details',            label: 'Receipt Details',             page: 'ReceiptDetails' },
      { id: 'voucher-entry',              label: 'Voucher Entry',               page: 'VoucherEntry' },
      { id: 'day-report',                 label: 'Day Report',                  page: 'DayReport' },
      { id: 'day-book',                   label: 'Day Book',                    page: 'DayBook' },
      { id: 'ledger-balance',             label: 'Ledger Balance',              page: 'LedgerBalance' },
      { id: 'monthly-ledger-balance',     label: 'Monthly Ledger Balance',      page: 'MonthlyLedgerBalance' },
      { id: 'outstanding-receipt-report', label: 'Outstanding Receipt Reports', page: 'OutstandingReceiptReport' },
      { id: 'payment-entry',              label: 'Payment Entry',               page: 'PaymentEntry' },
      { id: 'payment-details',            label: 'Payment Details',             page: 'PaymentDetails' },
      { id: 'journal-entry',              label: 'Journal Entry',               page: 'JournalEntry' },
    ],
  },
  {
    id: 'bom', label: 'BOM', icon: FileText, hiddenRoles: ['user'],
    children: [
      { id: 'bom-creation',            label: 'BOM Creation',            page: 'BOMCreation' },
      { id: 'customerwise-bom-report', label: 'Customerwise BOM Report', page: 'CustomerwiseBOMReport' },
      { id: 'index-creation',          label: 'Index Creation',          page: 'IndexCreation' },
      { id: 'index-creation-report',   label: 'Index Creation Report',   page: 'IndexCreationReport' },
      { id: 'upload-bom',              label: 'Upload BOM',              page: 'UploadBOM' },
      { id: 'main-index',              label: 'Main Index',              page: 'MainIndex' },
      { id: 'main-index-report',       label: 'Main Index Report',       page: 'MainIndexReport' },
      { id: 'view-model',              label: 'View Model',              page: 'ViewModel' },
    ],
  },
  {
    id: 'ccms', label: 'CCMS', icon: ClipboardList, hiddenRoles: ['user'],
    children: [
      { id: 'customer-complaint-entry', label: 'Customer Complaint Entry', page: 'CustomerComplaintEntry' },
      { id: 'ccms-entry-details', label: 'CCMS Entry Details', page: 'CCMSEntryDetails'},
    ],
  },
  {
    id: 'dc', label: 'DC', icon: Truck, hiddenRoles: ['user'],
    children: [
      { id: 'dc-entry',          label: 'DC Entry',   page: 'DCEntry' },
      { id: 'dc-details-report', label: 'DC Details', page: 'DCDetailsReport' },
    ],
  },
  {
    id: 'maintainance', label: 'Maintainance', icon: Wrench,
    children: [
      { id: 'machine-breakdown',       label: 'BreakDown Entry',        page: 'MachineBreakDown' },
      { id: 'breakdown-clearence',     label: 'Waiting for Clearence',  page: 'BreakDownClearence' },
      { id: 'breakdown-acceptance',    label: 'Waiting for Acceptance', page: 'BreakDownAcceptance' },
      { id: 'breakdown-approval-list', label: 'Acceptance Breakdown',   page: 'BreakDownApprovalList', hiddenRoles: ['user'] },
    ],
  },
  {
    id: 'nc', label: 'NC', icon: ShieldAlert,
    children: [
      { id: 'qc-rejection-details', label: 'NC Details',     page: 'QCRejectionDetails' },
      { id: 'nc-approval',          label: 'NC Approval',    page: 'NCApproval',          hiddenRoles: ['user'] },
      { id: 'nc-job-created',       label: 'NC Job Created', page: 'NCJobCreated',        hiddenRoles: ['user'] },
      { id: 'nc-dc-entry',          label: 'DC NC Entry',    page: 'NCDCEntry',           hiddenRoles: ['user'] },
      { id: 'nc-dc-details',        label: 'NC DC Details',  page: 'NCDCDetails',         hiddenRoles: ['user'] },
    ],
  },
  {
    id: 'production', label: 'Production', icon: LayoutGrid,
    children: [
      { id: 'job-list',                    label: 'Job List',                  page: 'JobList' },
      { id: 'barcode-details',             label: 'Print Barcode',             page: 'BarcodeDetails',            hiddenRoles: ['user'] },
      { id: 'auto-job-entry',              label: 'Service Auto Job Entry',    page: 'AutoJobEntry',              hiddenRoles: ['user'] },
      { id: 'service-job-entry-details',   label: 'Service Entry Details',     page: 'ServiceJobEntryDetails',    hiddenRoles: ['user'] },
      { id: 'conformation-list',           label: 'Conformation Final',        page: 'ConformationList',          hiddenRoles: ['user'] },
      { id: 'conformation-entry-details',  label: 'Conformation List Details', page: 'ConformationEntryDetails',  hiddenRoles: ['user'] },
      { id: 'process-card',                label: 'Process Card Entry new',    page: 'ProcessCard' },
      { id: 'raw-material-issue',          label: 'Rawmaterial Issue Job',     page: 'RawMaterialIssue' },
      { id: 'raw-material-issued-details', label: 'Rawmaterial Issue Details', page: 'RawMaterialIssuedDetails' },
      { id: 'prod-machine-breakdown',      label: 'BreakDown Entry',           page: 'MachineBreakDown' },
    ],
  },
  {
    id: 'technical', label: 'Technical', icon: Settings, hiddenRoles: ['user'],
    children: [
      // { id: 'drawing-upload',       label: 'Drawing Upload',       page: 'DrawingUpload' },
      { id: 'job-card-entry',       label: 'Job Card Entry',       page: 'JobCardEntry' },
      { id: 'process-menu',         label: 'Process Menu',         page: 'ProcessMenu' },
      { id: 'tech-auto-job',        label: 'Auto Job Entry',       page: 'TechAutoJobEntry' },
      { id: 'view-job-status',      label: 'View Job Status',      page: 'ViewJobStatus' },
      { id: 'waiting-for-approval', label: 'Waiting For Approval', page: 'WaitingForApproval' },
      { id: 'update-route-details', label: 'Update Route Details', page: 'UpdateRouteDetails' },
      // { id: 'rejected-job-list',    label: 'Rejected Job List',    page: 'RejectedJobList' },
      { id: 'process-completed',    label: 'Process Completed',    page: 'ProcessCompleted' },
      // { id: 'file-uploads',         label: 'File Uploads',         page: 'FileUploads' },
      { id: 'mr-approval',          label: 'MR Approval',          page: 'MRApproval' },
      { id: 'nc-job-created',       label: 'NC Job Created',       page: 'NCJobCreated' },
      { id: 'nc-approval',          label: 'NC Approval',          page: 'NCApproval' },
      // { id: 'job-entry-closed',     label: 'Job Entry Closed',     page: 'JobEntryClosed' },
      // { id: 'job-card-cancel',      label: 'Job Card Cancel',      page: 'JobCardCancel' },
      { id: 'ipr-approval',         label: 'PR Approval',          page: 'IPRApproval' },
      { id: 'job-qty-mismatch',     label: 'Job Qty Mismatch',     page: 'JobQtyMismatch' },
      { id: 'process-card-close',   label: 'Process Card Close',   page: 'ProcessCardClose' },
      { id: 'job-qc-entry',         label: 'Job QC Entry',         page: 'JobQCEntry' },
    ],
  },
  {
    id: 'sales', label: 'Sales', icon: LayoutGrid, hiddenRoles: ['user'],
    children: [
      { id: 'credit-sales',                label: 'Sales',                    page: 'CreditSales' },
      { id: 'sales-details',               label: 'Sales Details',            page: 'SalesDetails' },
      { id: 'quotation-sales',             label: 'Quotation Sales',          page: 'QuotationSales' },
      { id: 'quotation-details',           label: 'Quotation Details',        page: 'QuotationDetails' },
      { id: 'dc-sales',                    label: 'DC Sales',                 page: 'DCSales' },
      { id: 'dc-details',                  label: 'DC Sales Details',         page: 'DCDetails' },
      { id: 'service-bill-entry',          label: 'Service Bill Entry',       page: 'ServiceBillEntry' },
      { id: 'service-bill-details',        label: 'Service Bill Details',     page: 'ServiceBillDetails' },
      { id: 'service-labour-bill-details', label: 'Service Labour Details',   page: 'ServiceLabourBillDetails' },
      { id: 'temp-service-bill-details',   label: 'Temp Ser Bill Details',    page: 'TempServiceBillDetails' },
    ],
  },
  {
    id: 'report', label: 'Report', icon: FileText, hiddenRoles: ['user'],
    children: [
      { id: 'mat-req-rej-list',             label: 'Raw Material Rejected',   page: 'MaterialRequestRejectionList' },
      { id: 'inward-reports',               label: 'Inward Details',          page: 'InwardReports' },
      { id: 'outward-details',              label: 'Outward Details',         page: 'OutwardDetails' },
      { id: 'min-stock',                    label: 'Min Stock Report',        page: 'MinStock' },
      { id: 'mat-issued-details',           label: 'Return RawMaterial',      page: 'MaterialIssuedDetails' },
      { id: 'completed-job-list',           label: 'Completed Job List',      page: 'CompletedJobList' },
      { id: 'purchase-order-report',        label: 'Purchase Order Report',   page: 'PurchaseOrderReport' },
      { id: 'purchase-order-overall-report',label: 'Purchase Order Overall',  page: 'PurchaseOrderOverallReport' },
      { id: 'current-stock',                label: 'Stock Report',            page: 'CurrentStock' },
      { id: 'qc-completed-list',            label: 'QC Completed List',       page: 'QCCompletedList' },
      { id: 'mat-issue-correction',         label: 'Stock Issue Delete',      page: 'MaterialIssueCorrection' },
      { id: 'stock-details',                label: 'Stock Checking',          page: 'StockDetails' },
      { id: 'qc-entry-report',              label: 'QC Entry Report',         page: 'QCEntryReport' },
    ],
  },
]

// Build { pageKey: urlPath } from NAV — first occurrence wins for duplicate page keys
export const PAGE_TO_PATH = (() => {
  const map = {}
  for (const item of NAV) {
    const hasChildren = item.children && item.children.length > 0
    if (!hasChildren) {
      if (item.page && !map[item.page]) {
        map[item.page] = '/' + item.id.replace(/-top$/, '')
      }
    } else {
      for (const child of item.children) {
        if (child.page && !map[child.page]) {
          map[child.page] = '/' + item.id + '/' + child.id
        }
      }
    }
  }
  return map
})()
