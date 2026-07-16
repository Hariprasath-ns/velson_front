import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { PAGE_TO_PATH, NAV } from './config/nav'
import { useAuth } from './context/AuthContext'
import { useModulePermission } from './hooks/useModulePermission'

const BookingEntryNew = lazy(() => import('./pages/BookingEntryNew'))
const ServiceQuotation = lazy(() => import('./pages/ServiceQuotation'))
const ServiceQuotationDetails = lazy(() => import('./pages/ServiceQuotationDetails'))
const ServiceDetailsEntry = lazy(() => import('./pages/ServiceDetailsEntry'))
const ServiceDetailsReport = lazy(() => import('./pages/ServiceDetailsReport'))
const ServiceBookingDetails = lazy(() => import('./pages/ServiceBookingDetails'))
const ServiceSpareEntry = lazy(() => import('./pages/ServiceSpareEntry'))


const TaxLedgerMaster = lazy(() => import('./pages/TaxLedgerMaster'))
const ItemMaster = lazy(() => import('./pages/ItemMaster'))
const PartNumberBaseMaster = lazy(() => import('./pages/PartNumberBaseMaster'))
const TaxMaster = lazy(() => import('./pages/TaxMaster'))
const ItemGroupMaster = lazy(() => import('./pages/ItemGroupMaster'))
const SupplierMaster = lazy(() => import('./pages/SupplierMaster'))
const CustomerMaster = lazy(() => import('./pages/CustomerMaster'))
const VehicleMaster = lazy(() => import('./pages/VehicleMaster'))
const QuotationEntry = lazy(() => import('./pages/QuotationEntry'))
const QuotationDetails = lazy(() => import('./pages/QuotationDetails'))
const PurchaseOrderEntry = lazy(() => import('./pages/PurchaseOrderEntry'))
const PurchaseOrderDetails = lazy(() => import('./pages/PurchaseOrderDetails'))
const PrintPurchaseOrder = lazy(() => import('./pages/PrintPurchaseOrder'))
const PurchaseRequestEntry = lazy(() => import('./pages/PurchaseRequestEntry'))
const PrintPurchaseRequest = lazy(() => import('./pages/PrintPurchaseRequest'))
const MaterialRequestEntry = lazy(() => import('./pages/MaterialRequestEntry'))
const PrintMaterialRequest = lazy(() => import('./pages/PrintMaterialRequest'))
const GateEntry = lazy(() => import('./pages/GateEntry'))
const GateEntryReport = lazy(() => import('./pages/GateEntryReport'))
const GRNEntry = lazy(() => import('./pages/GRNEntry'))
const GRNEntryReport = lazy(() => import('./pages/GRNEntryReport'))
const CompanyMaster = lazy(() => import('./pages/CompanyMaster'))
const EmployeeMaster = lazy(() => import('./pages/EmployeeMaster'))
const LedgerGroupMaster = lazy(() => import('./pages/LedgerGroupMaster'))
const MachineMaster = lazy(() => import('./pages/MachineMaster'))
const VehicleServiceMaster = lazy(() => import('./pages/VehicleServiceMaster'))
const ContractorMaster = lazy(() => import('./pages/ContractorMaster'))
const ProcessMaster = lazy(() => import('./pages/ProcessMaster'))
const PartUsageList = lazy(() => import('./pages/PartUsageList'))
const QCCheckMethod = lazy(() => import('./pages/QCCheckMethod'))
const QCInspectionChar = lazy(() => import('./pages/QCInspectionChar'))
const QCStandardMaster = lazy(() => import('./pages/QCStandardMaster'))
const AutoPO = lazy(() => import('./pages/AutoPO'))
const SystemInfoMaster = lazy(() => import('./pages/SystemInfoMaster'))
const DBCopy = lazy(() => import('./pages/DBCopy'))
const RestoreDB = lazy(() => import('./pages/RestoreDB'))
const ReceiptEntry = lazy(() => import('./pages/ReceiptEntry'))
const ReceiptDetails = lazy(() => import('./pages/ReceiptDetails'))
const VoucherEntry = lazy(() => import('./pages/VoucherEntry'))
const DayReport = lazy(() => import('./pages/DayReport'))
const DayBook = lazy(() => import('./pages/DayBook'))
const LedgerBalance = lazy(() => import('./pages/LedgerBalance'))
const MonthlyLedgerBalance = lazy(() => import('./pages/MonthlyLedgerBalance'))
const OutstandingReceiptReport = lazy(() => import('./pages/OutstandingReceiptReport'))
const PaymentEntry = lazy(() => import('./pages/PaymentEntry'))
const PaymentDetails = lazy(() => import('./pages/PaymentDetails'))
const JournalEntry = lazy(() => import('./pages/JournalEntry'))
const BOMCreation = lazy(() => import('./pages/BOMCreation'))
const BOMCreationReport = lazy(() => import('./pages/BOMCreationReport'))
const IndexCreation = lazy(() => import('./pages/IndexCreation'))
const IndexCreationReport = lazy(() => import('./pages/IndexCreationReport'))
const UploadBOM = lazy(() => import('./pages/UploadBOM'))
const MainIndex = lazy(() => import('./pages/MainIndex'))
const MainIndexReport = lazy(() => import('./pages/MainIndexReport'))
const ViewModel = lazy(() => import('./pages/ViewModel'))
const CustomerComplaintEntry = lazy(() => import('./pages/CustomerComplaintEntry'))
// const CCMSEntryDetails = lazy(() => import('./pages/CCMSEntryDetails'))
const DCEntry = lazy(() => import('./pages/DCEntry'))
const MachineBreakDown = lazy(() => import('./pages/MachineBreakDown'))
const BreakDownClearence = lazy(() => import('./pages/BreakDownClearence'))
const BreakDownAcceptance = lazy(() => import('./pages/BreakDownAcceptance'))
const BreakDownApprovalList = lazy(() => import('./pages/BreakDownApprovalList'))
const QCRejectionDetails = lazy(() => import('./pages/QCRejectionDetails'))
const NCApproval = lazy(() => import('./pages/NCApproval'))
const NCJobCreated = lazy(() => import('./pages/NCJobCreated'))
const NCDCEntry = lazy(() => import('./pages/NCDCEntry'))
const NCDCDetails = lazy(() => import('./pages/NCDCDetails'))
const JobList = lazy(() => import('./pages/JobList'))
const BarcodeDetails = lazy(() => import('./pages/BarcodeDetails'))
const AutoJobEntry = lazy(() => import('./pages/AutoJobEntry'))
const ServiceJobEntryDetails = lazy(() => import('./pages/ServiceJobEntryDetails'))
const ConformationList = lazy(() => import('./pages/ConformationList'))
const ConformationEntryDetails = lazy(() => import('./pages/ConformationEntryDetails'))
const ProcessCard = lazy(() => import('./pages/ProcessCard'))
const RawMaterialIssue = lazy(() => import('./pages/RawMaterialIssue'))
const RawMaterialIssuedDetails = lazy(() => import('./pages/RawMaterialIssuedDetails'))
const MaterialRequestRejectionList = lazy(() => import('./pages/MaterialRequestRejectionList'))
const InwardReports = lazy(() => import('./pages/InwardReports'))
const OutwardDetails = lazy(() => import('./pages/OutwardDetails'))
const MinStock = lazy(() => import('./pages/MinStock'))
const MaterialIssuedDetails = lazy(() => import('./pages/MaterialIssuedDetails'))
const CompletedJobList = lazy(() => import('./pages/CompletedJobList'))
const PurchaseOrderReport = lazy(() => import('./pages/PurchaseOrderReport'))
const PurchaseOrderOverallReport = lazy(() => import('./pages/PurchaseOrderOverallReport'))
const CurrentStock = lazy(() => import('./pages/CurrentStock'))
const QCCompletedList = lazy(() => import('./pages/QCCompletedList'))
const MaterialIssueCorrection = lazy(() => import('./pages/MaterialIssueCorrection'))
const StockManagement = lazy(() => import('./pages/StockManagement'))
const MaterialIssue = lazy(() => import('./pages/MaterialIssue'))
const StockDetails = lazy(() => import('./pages/StockDetails'))
const QCEntryReport = lazy(() => import('./pages/QCEntryReport'))
const CreditSales = lazy(() => import('./pages/CreditSales'))
const SalesDetails = lazy(() => import('./pages/SalesDetails'))
const QuotationSales = lazy(() => import('./pages/QuotationSales'))
const DCDetails = lazy(() => import('./pages/DCDetails'))
const DCDetailsReport = lazy(() => import('./pages/DCDetailsReport'))
const ServiceBillEntry = lazy(() => import('./pages/ServiceBillEntry'))
const ServiceBillDetails = lazy(() => import('./pages/ServiceBillDetails'))
const ServiceLabourBillDetails = lazy(() => import('./pages/ServiceLabourBillDetails'))
const TempServiceBillDetails = lazy(() => import('./pages/TempServiceBillDetails'))
const DrawingUpload = lazy(() => import('./pages/DrawingUpload'))
const MarketingLog = lazy(() => import('./pages/MarketingLog'))

const ProformaEntry = () => <div className="p-8 bg-[#f4f6f8] min-h-screen text-slate-800"><h2 className="text-xl font-bold uppercase tracking-tight text-[#0097A7]">Proforma Entry</h2><p className="mt-2 text-slate-500">This page is under active development.</p></div>
const ProformaDetails = () => <div className="p-8 bg-[#f4f6f8] min-h-screen text-slate-800"><h2 className="text-xl font-bold uppercase tracking-tight text-[#0097A7]">Proforma Entry Details</h2><p className="mt-2 text-slate-500">This page is under active development.</p></div>
const MarketingReport = () => <div className="p-8 bg-[#f4f6f8] min-h-screen text-slate-800"><h2 className="text-xl font-bold uppercase tracking-tight text-[#0097A7]">Marketing Log Report</h2><p className="mt-2 text-slate-500">This page is under active development.</p></div>

const JobCardEntry = lazy(() => import('./pages/JobCardEntry'))
const ProcessMenu = lazy(() => import('./pages/ProcessMenu'))
const TechAutoJobEntry = lazy(() => import('./pages/TechAutoJobEntry'))
const ViewJobStatus = lazy(() => import('./pages/ViewJobStatus'))
const WaitingForApproval = lazy(() => import('./pages/WaitingForApproval'))
const UpdateRouteDetails = lazy(() => import('./pages/UpdateRouteDetails'))
const RejectedJobList = lazy(() => import('./pages/RejectedJobList'))
const ProcessCompleted = lazy(() => import('./pages/ProcessCompleted'))
const FileUploads = lazy(() => import('./pages/FileUploads'))
const MRApproval = lazy(() => import('./pages/MRApproval'))
const JobEntryClosed = lazy(() => import('./pages/JobEntryClosed'))
const JobCardCancel = lazy(() => import('./pages/JobCardCancel'))
const IPRApproval = lazy(() => import('./pages/IPRApproval'))
const PoApproval = lazy(() => import('./pages/PoApproval'))
const ReferenceMaster = lazy(() => import('./pages/ReferenceMaster'))
import LoginPage from './pages/LoginPage'
import { DashboardPage } from './pages/OtherPages'
const JobQtyMismatch = lazy(() => import('./pages/JobQtyMismatch'))
const ProcessCardClose = lazy(() => import('./pages/ProcessCardClose'))
const JobQCEntry = lazy(() => import('./pages/JobQCEntry'))
const OutsourcePartsRegister = lazy(() => import('./pages/OutsourcePartsRegister'))
const OutsourcePartsRegisterDetails = lazy(() => import('./pages/OutsourcePartsRegisterDetails'))

const Users = lazy(() => import('./pages/Users/Users'))
import CCMSEntryDetails from './pages/CCMSEntryDetails'
const NotificationHistory = lazy(() => import('./pages/Notifications/NotificationHistory'))
const UserNotificationPreferences = lazy(() => import('./pages/Notifications/UserNotificationPreferences'))
const NotificationRights = lazy(() => import('./pages/Notifications/NotificationRights'))
const SalesDashboard = lazy(() => import('./pages/SalesDashboard'))
const StockDashboard = lazy(() => import('./pages/StockDashboard'))
const MainDashboard = lazy(() => import('./pages/MainDashboard'))
const QuotationSalesDetails = lazy(() => import('./pages/QuatationSalesDetails'))
const LandingPage = lazy(() => import('./pages/LandingPage'))

// page key → component (used to build <Route> elements)
const PAGE_COMPONENTS = {
  Dashboard: DashboardPage,
  SalesDashboard: SalesDashboard,
  StockDashboard: StockDashboard,
  MainDashboard: MainDashboard,
  PartNumberBase: PartNumberBaseMaster,
  TaxLedger: TaxLedgerMaster,
  TaxMaster: TaxMaster,
  ItemGroup: ItemGroupMaster,
  ItemMaster: ItemMaster,
  ServiceQuotation: ServiceQuotation,
  BookingEntryNew: BookingEntryNew,
  ServiceQuotationDetails: ServiceQuotationDetails,
  ServiceDetailsEntry: ServiceDetailsEntry,
  ServiceDetailsReport: ServiceDetailsReport,
  ServiceBookingDetails: ServiceBookingDetails,
  ServiceSpareEntry: ServiceSpareEntry,
  SupplierMaster: SupplierMaster,
  CustomerMaster: CustomerMaster,
  VehicleMaster: VehicleMaster,
  QuotationEntry: QuotationEntry,
  QuotationDetails: QuotationDetails,
  PurchaseOrderEntry: PurchaseOrderEntry,
  PurchaseOrderDetails: PurchaseOrderDetails,
  PrintPurchaseOrder: PrintPurchaseOrder,
  PurchaseRequestEntry: PurchaseRequestEntry,
  PrintPurchaseRequest: PrintPurchaseRequest,
  MaterialRequestEntry: MaterialRequestEntry,
  PrintMaterialRequest: PrintMaterialRequest,
  GateEntry: GateEntry,
  GateEntryReport: GateEntryReport,
  GRNEntry: GRNEntry,
  GRNEntryReport: GRNEntryReport,
  CompanyMaster: CompanyMaster,
  EmployeeMaster: EmployeeMaster,
  LedgerGroupMaster: LedgerGroupMaster,
  MachineMaster: MachineMaster,
  MaterialIssue: MaterialIssue,
  VehicleServiceMaster: VehicleServiceMaster,
  ContractorMaster: ContractorMaster,
  ProcessMaster: ProcessMaster,
  ReferenceMaster: ReferenceMaster,
  PartUsageList: PartUsageList,
  QCCheckMethod: QCCheckMethod,
  QCInspectionChar: QCInspectionChar,
  QCStandardMaster: QCStandardMaster,
  AutoPO: AutoPO,
  SystemInfoMaster: SystemInfoMaster,
  DBCopy: DBCopy,
  RestoreDB: RestoreDB,
  ReceiptEntry: ReceiptEntry,
  ReceiptDetails: ReceiptDetails,
  VoucherEntry: VoucherEntry,
  DayReport: DayReport,
  DayBook: DayBook,
  LedgerBalance: LedgerBalance,
  MonthlyLedgerBalance: MonthlyLedgerBalance,
  OutstandingReceiptReport: OutstandingReceiptReport,
  PaymentEntry: PaymentEntry,
  PaymentDetails: PaymentDetails,
  JournalEntry: JournalEntry,
  BOMCreation: BOMCreation,
  CustomerwiseBOMReport: BOMCreationReport,
  IndexCreation: IndexCreation,
  IndexCreationReport: IndexCreationReport,
  UploadBOM: UploadBOM,
  MainIndex: MainIndex,
  MainIndexReport: MainIndexReport,
  ViewModel: ViewModel,
  CustomerComplaintEntry: CustomerComplaintEntry,
  CCMSEntryDetails: CCMSEntryDetails,
  DCEntry: DCEntry,
  MachineBreakDown: MachineBreakDown,
  BreakDownClearence: BreakDownClearence,
  BreakDownAcceptance: BreakDownAcceptance,
  BreakDownApprovalList: BreakDownApprovalList,
  QCRejectionDetails: QCRejectionDetails,
  NCApproval: NCApproval,
  NCJobCreated: NCJobCreated,
  NCDCEntry: NCDCEntry,
  NCDCDetails: NCDCDetails,
  JobList: JobList,
  BarcodeDetails: BarcodeDetails,
  AutoJobEntry: AutoJobEntry,
  ServiceJobEntryDetails: ServiceJobEntryDetails,
  ConformationList: ConformationList,
  ConformationEntryDetails: ConformationEntryDetails,
  ProcessCard: ProcessCard,
  RawMaterialIssue: RawMaterialIssue,
  RawMaterialIssuedDetails: RawMaterialIssuedDetails,
  MaterialRequestRejectionList: MaterialRequestRejectionList,
  InwardReports: InwardReports,
  OutwardDetails: OutwardDetails,
  MinStock: MinStock,
  StockManagement: StockManagement,
  MaterialIssuedDetails: MaterialIssuedDetails,
  CompletedJobList: CompletedJobList,
  PurchaseOrderReport: PurchaseOrderReport,
  PurchaseOrderOverallReport: PurchaseOrderOverallReport,
  CurrentStock: CurrentStock,
  QCCompletedList: QCCompletedList,
  MaterialIssueCorrection: MaterialIssueCorrection,
  StockDetails: StockDetails,
  QCEntryReport: QCEntryReport,
  CreditSales: CreditSales,
  SalesDetails: SalesDetails,
  QuotationSales: QuotationSales,
  // Ve,
  OutsourcePartsRegister: OutsourcePartsRegister,
  OutsourcePartsRegisterDetails: OutsourcePartsRegisterDetails,
  DCDetails: DCDetails,
  DCDetailsReport: DCDetailsReport,
  ServiceBillEntry: ServiceBillEntry,
  ServiceBillDetails: ServiceBillDetails,
  ServiceLabourBillDetails: ServiceLabourBillDetails,
  TempServiceBillDetails: TempServiceBillDetails,
  DrawingUpload: DrawingUpload,
  MarketingLog: MarketingLog,
  ProformaEntry: ProformaEntry,
  ProformaDetails: ProformaDetails,
  MarketingReport: MarketingReport,
  JobCardEntry: JobCardEntry,
  ProcessMenu: ProcessMenu,
  TechAutoJobEntry: TechAutoJobEntry,
  ViewJobStatus: ViewJobStatus,
  WaitingForApproval: WaitingForApproval,
  UpdateRouteDetails: UpdateRouteDetails,
  RejectedJobList: RejectedJobList,
  ProcessCompleted: ProcessCompleted,
  FileUploads: FileUploads,
  MRApproval: MRApproval,
  JobEntryClosed: JobEntryClosed,
  JobCardCancel: JobCardCancel,
  IPRApproval: IPRApproval,
  PoApproval: PoApproval,
  JobQtyMismatch: JobQtyMismatch,
  ProcessCardClose: ProcessCardClose,
  JobQCEntry: JobQCEntry,
  Users: Users,
  NotificationHistory: NotificationHistory,
  UserNotificationPreferences: UserNotificationPreferences,
  NotificationRights: NotificationRights,
  QuotationSalesDetails: QuotationSalesDetails,
  LandingPage: LandingPage,
}

// Bridges legacy velson:navigate custom events to React Router navigation.
// Pages that still dispatch window events work without modification.
function NavigationEventBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = e => {
      const pageKey = e.detail?.page ?? e.detail
      const path = PAGE_TO_PATH[pageKey]
      if (!path) return
      navigate(path)
    }
    window.addEventListener('velson:navigate', handler)
    return () => window.removeEventListener('velson:navigate', handler)
  }, [navigate])

  return null
}

const PAGE_TO_MODULE = (() => {
  const map = {}
  for (const item of NAV) {
    const hasChildren = item.children && item.children.length > 0
    if (!hasChildren) {
      if (item.page && !map[item.page]) {
        map[item.page] = item.id.replace(/-top$/, '')
      }
    } else {
      for (const child of item.children) {
        if (child.page && !map[child.page]) {
          map[child.page] = child.id
        }
      }
    }
  }
  return map
})()

function ProtectedRoute({ pageKey, children }) {
  if (pageKey === "NotificationHistory" || pageKey === "UserNotificationPreferences" || pageKey === "NotificationRights") {
    return children
  }
  const moduleCode = PAGE_TO_MODULE[pageKey]
  const { canDisplay } = useModulePermission(moduleCode || '')

  if (!moduleCode || canDisplay) {
    return children
  }

  return <Navigate to="/LandingPage" replace />
}

function AppRoutes() {
  return (
    <>
      <NavigationEventBridge />
      <Layout>
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/LandingPage" replace />} />
          <Route path="/LandingPage" element={<LandingPage />} />
          {Object.entries(PAGE_COMPONENTS).map(([pageKey, Component]) => {
            const path = PAGE_TO_PATH[pageKey]
            if (!path) return null
            return (
              <Route
                key={pageKey}
                path={path}
                element={
                  <ProtectedRoute pageKey={pageKey}>
                    <Component />
                  </ProtectedRoute>
                }
              />
            )
          })}
          <Route path="*" element={<Navigate to="/LandingPage" replace />} />
        </Routes>
        </Suspense>
      </Layout>
    </>
  )
}

// ─── LOGIN GATE ──────────────────────────────────────────────────────────────
// Set to true  → login page required; users must authenticate
// Set to false → login skipped; app opens directly as admin (dev / demo mode)
const LOGIN_REQUIRED = true
// ─────────────────────────────────────────────────────────────────────────────

// Default identity used when LOGIN_REQUIRED = false
const BYPASS_ADMIN = {
  token: 'bypass',
  user: { id: 0, name: 'Administrator', email: 'admin@admin.com', role: 'admin' },
}

export default function App() {
  const { auth, login } = useAuth()

  // When login is disabled: auto-inject admin on first render AND after logout
  useEffect(() => {
    if (!LOGIN_REQUIRED && !auth) login(BYPASS_ADMIN)
  }, [auth, login])

  // LOGIN_REQUIRED = true  → gate on; show login if not authenticated
  // LOGIN_REQUIRED = false → gate off; brief null while effect fires, then admin
  if (LOGIN_REQUIRED && !auth) return <LoginPage onLogin={login} />
  if (!auth) return null

  return <AppRoutes />
}