import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { PAGE_TO_PATH } from './config/nav'
import { useAuth } from './context/AuthContext'

import BookingEntryNew from './pages/BookingEntryNew'
import ServiceQuotation from './pages/ServiceQuotation'
import ServiceQuotationDetails from './pages/ServiceQuotationDetails'
import ServiceDetailsEntry from './pages/ServiceDetailsEntry'
import ServiceDetailsReport from './pages/ServiceDetailsReport'
import ServiceBookingDetails from './pages/ServiceBookingDetails'
import ServiceSpareEntry from './pages/ServiceSpareEntry'


import TaxLedgerMaster from './pages/TaxLedgerMaster'
import ItemMaster from './pages/ItemMaster'
import PartNumberBaseMaster from './pages/PartNumberBaseMaster'
import TaxMaster from './pages/TaxMaster'
import ItemGroupMaster from './pages/ItemGroupMaster'
import SupplierMaster from './pages/SupplierMaster'
import CustomerMaster from './pages/CustomerMaster'
import VehicleMaster from './pages/VehicleMaster'
import QuotationEntry from './pages/QuotationEntry'
import QuotationDetails from './pages/QuotationDetails'
import PurchaseOrderEntry from './pages/PurchaseOrderEntry'
import PurchaseOrderDetails from './pages/PurchaseOrderDetails'
import PrintPurchaseOrder from './pages/PrintPurchaseOrder'
import PurchaseRequestEntry from './pages/PurchaseRequestEntry'
import PrintPurchaseRequest from './pages/PrintPurchaseRequest'
import MaterialRequestEntry from './pages/MaterialRequestEntry'
import PrintMaterialRequest from './pages/PrintMaterialRequest'
import GateEntry from './pages/GateEntry'
import GateEntryReport from './pages/GateEntryReport'
import GRNEntry from './pages/GRNEntry'
import GRNEntryReport from './pages/GRNEntryReport'
import CompanyMaster from './pages/CompanyMaster'
import EmployeeMaster from './pages/EmployeeMaster'
import LedgerGroupMaster from './pages/LedgerGroupMaster'
import MachineMaster from './pages/MachineMaster'
import VehicleServiceMaster from './pages/VehicleServiceMaster'
import ContractorMaster from './pages/ContractorMaster'
import ProcessMaster from './pages/ProcessMaster'
import PartUsageList from './pages/PartUsageList'
import QCCheckMethod from './pages/QCCheckMethod'
import QCInspectionChar from './pages/QCInspectionChar'
import QCStandardMaster from './pages/QCStandardMaster'
import AutoPO from './pages/AutoPO'
import SystemInfoMaster from './pages/SystemInfoMaster'
import DBCopy from './pages/DBCopy'
import RestoreDB from './pages/RestoreDB'
import ReceiptEntry from './pages/ReceiptEntry'
import ReceiptDetails from './pages/ReceiptDetails'
import VoucherEntry from './pages/VoucherEntry'
import DayReport from './pages/DayReport'
import DayBook from './pages/DayBook'
import LedgerBalance from './pages/LedgerBalance'
import MonthlyLedgerBalance from './pages/MonthlyLedgerBalance'
import OutstandingReceiptReport from './pages/OutstandingReceiptReport'
import PaymentEntry from './pages/PaymentEntry'
import PaymentDetails from './pages/PaymentDetails'
import JournalEntry from './pages/JournalEntry'
import BOMCreation from './pages/BOMCreation'
import BOMCreationReport from './pages/BOMCreationReport'
import IndexCreation from './pages/IndexCreation'
import IndexCreationReport from './pages/IndexCreationReport'
import UploadBOM from './pages/UploadBOM'
import MainIndex from './pages/MainIndex'
import MainIndexReport from './pages/MainIndexReport'
import ViewModel from './pages/ViewModel'
import CustomerComplaintEntry from './pages/CustomerComplaintEntry'
// import CCMSEntryDetails from './pages/CCMSEntryDetails'
import DCEntry from './pages/DCEntry'
import MachineBreakDown from './pages/MachineBreakDown'
import BreakDownClearence from './pages/BreakDownClearence'
import BreakDownAcceptance from './pages/BreakDownAcceptance'
import BreakDownApprovalList from './pages/BreakDownApprovalList'
import QCRejectionDetails from './pages/QCRejectionDetails'
import NCApproval from './pages/NCApproval'
import NCJobCreated from './pages/NCJobCreated'
import NCDCEntry from './pages/NCDCEntry'
import NCDCDetails from './pages/NCDCDetails'
import JobList from './pages/JobList'
import BarcodeDetails from './pages/BarcodeDetails'
import AutoJobEntry from './pages/AutoJobEntry'
import ServiceJobEntryDetails from './pages/ServiceJobEntryDetails'
import ConformationList from './pages/ConformationList'
import ConformationEntryDetails from './pages/ConformationEntryDetails'
import ProcessCard from './pages/ProcessCard'
import RawMaterialIssue from './pages/RawMaterialIssue'
import RawMaterialIssuedDetails from './pages/RawMaterialIssuedDetails'
import MaterialRequestRejectionList from './pages/MaterialRequestRejectionList'
import InwardReports from './pages/InwardReports'
import OutwardDetails from './pages/OutwardDetails'
import MinStock from './pages/MinStock'
import MaterialIssuedDetails from './pages/MaterialIssuedDetails'
import CompletedJobList from './pages/CompletedJobList'
import PurchaseOrderReport from './pages/PurchaseOrderReport'
import PurchaseOrderOverallReport from './pages/PurchaseOrderOverallReport'
import CurrentStock from './pages/CurrentStock'
import QCCompletedList from './pages/QCCompletedList'
import MaterialIssueCorrection from './pages/MaterialIssueCorrection'
import StockDetails from './pages/StockDetails'
import QCEntryReport from './pages/QCEntryReport'
import CreditSales from './pages/CreditSales'
import SalesDetails from './pages/SalesDetails'
import QuotationSales from './pages/QuotationSales'
import DCSales from './pages/DCSales'
import DCDetails from './pages/DCDetails'
import DCDetailsReport from './pages/DCDetailsReport'
import ServiceBillEntry from './pages/ServiceBillEntry'
import ServiceBillDetails from './pages/ServiceBillDetails'
import ServiceLabourBillDetails from './pages/ServiceLabourBillDetails'
import TempServiceBillDetails from './pages/TempServiceBillDetails'
import DrawingUpload from './pages/DrawingUpload'
import MarketingLog from './pages/MarketingLog'

const ProformaEntry = () => <div className="p-8 bg-[#f4f6f8] min-h-screen text-slate-800"><h2 className="text-xl font-bold uppercase tracking-tight text-[#0097A7]">Proforma Entry</h2><p className="mt-2 text-slate-500">This page is under active development.</p></div>
const ProformaDetails = () => <div className="p-8 bg-[#f4f6f8] min-h-screen text-slate-800"><h2 className="text-xl font-bold uppercase tracking-tight text-[#0097A7]">Proforma Entry Details</h2><p className="mt-2 text-slate-500">This page is under active development.</p></div>
const MarketingReport = () => <div className="p-8 bg-[#f4f6f8] min-h-screen text-slate-800"><h2 className="text-xl font-bold uppercase tracking-tight text-[#0097A7]">Marketing Log Report</h2><p className="mt-2 text-slate-500">This page is under active development.</p></div>

import JobCardEntry from './pages/JobCardEntry'
import ProcessMenu from './pages/ProcessMenu'
import TechAutoJobEntry from './pages/TechAutoJobEntry'
import ViewJobStatus from './pages/ViewJobStatus'
import WaitingForApproval from './pages/WaitingForApproval'
import UpdateRouteDetails from './pages/UpdateRouteDetails'
import RejectedJobList from './pages/RejectedJobList'
import ProcessCompleted from './pages/ProcessCompleted'
import FileUploads from './pages/FileUploads'
import MRApproval from './pages/MRApproval'
import JobEntryClosed from './pages/JobEntryClosed'
import JobCardCancel from './pages/JobCardCancel'
import IPRApproval from './pages/IPRApproval'
import ReferenceMaster from './pages/ReferenceMaster'
import LoginPage from './pages/LoginPage'
import { DashboardPage } from './pages/OtherPages'
import JobQtyMismatch from './pages/JobQtyMismatch'
import ProcessCardClose from './pages/ProcessCardClose'
import JobQCEntry from './pages/JobQCEntry'

import Users from './pages/Users/Users'
import CCMSEntryDetails from './pages/CCMSEntryDetails'

// page key → component (used to build <Route> elements)
const PAGE_COMPONENTS = {
  Dashboard:                   DashboardPage,
  PartNumberBase:              PartNumberBaseMaster,
  TaxLedger:                   TaxLedgerMaster,
  TaxMaster:                   TaxMaster,
  ItemGroup:                   ItemGroupMaster,
  ItemMaster:                  ItemMaster,
  ServiceQuotation:            ServiceQuotation,
  BookingEntryNew:             BookingEntryNew,
  ServiceQuotationDetails:     ServiceQuotationDetails,
  ServiceDetailsEntry:         ServiceDetailsEntry,
  ServiceDetailsReport:        ServiceDetailsReport,
  ServiceBookingDetails:       ServiceBookingDetails,
  ServiceSpareEntry:           ServiceSpareEntry,
  SupplierMaster:              SupplierMaster,
  CustomerMaster:              CustomerMaster,
  VehicleMaster:               VehicleMaster,
  QuotationEntry:              QuotationEntry,
  QuotationDetails:            QuotationDetails,
  PurchaseOrderEntry:          PurchaseOrderEntry,
  PurchaseOrderDetails:        PurchaseOrderDetails,
  PrintPurchaseOrder:          PrintPurchaseOrder,
  PurchaseRequestEntry:        PurchaseRequestEntry,
  PrintPurchaseRequest:        PrintPurchaseRequest,
  MaterialRequestEntry:        MaterialRequestEntry,
  PrintMaterialRequest:        PrintMaterialRequest,
  GateEntry:                   GateEntry,
  GateEntryReport:             GateEntryReport,
  GRNEntry:                    GRNEntry,
  GRNEntryReport:              GRNEntryReport,
  CompanyMaster:               CompanyMaster,
  EmployeeMaster:              EmployeeMaster,
  LedgerGroupMaster:           LedgerGroupMaster,
  MachineMaster:               MachineMaster,
  VehicleServiceMaster:        VehicleServiceMaster,
  ContractorMaster:            ContractorMaster,
  ProcessMaster:               ProcessMaster,
  ReferenceMaster:             ReferenceMaster,
  PartUsageList:               PartUsageList,
  QCCheckMethod:               QCCheckMethod,
  QCInspectionChar:            QCInspectionChar,
  QCStandardMaster:            QCStandardMaster,
  AutoPO:                      AutoPO,
  SystemInfoMaster:            SystemInfoMaster,
  DBCopy:                      DBCopy,
  RestoreDB:                   RestoreDB,
  ReceiptEntry:                ReceiptEntry,
  ReceiptDetails:              ReceiptDetails,
  VoucherEntry:                VoucherEntry,
  DayReport:                   DayReport,
  DayBook:                     DayBook,
  LedgerBalance:               LedgerBalance,
  MonthlyLedgerBalance:        MonthlyLedgerBalance,
  OutstandingReceiptReport:    OutstandingReceiptReport,
  PaymentEntry:                PaymentEntry,
  PaymentDetails:              PaymentDetails,
  JournalEntry:                JournalEntry,
  BOMCreation:                 BOMCreation,
  CustomerwiseBOMReport:       BOMCreationReport,
  IndexCreation:               IndexCreation,
  IndexCreationReport:         IndexCreationReport,
  UploadBOM:                   UploadBOM,
  MainIndex:                   MainIndex,
  MainIndexReport:             MainIndexReport,
  ViewModel:                   ViewModel,
  CustomerComplaintEntry:      CustomerComplaintEntry,
  CCMSEntryDetails:            CCMSEntryDetails,
  DCEntry:                     DCEntry,
  MachineBreakDown:            MachineBreakDown,
  BreakDownClearence:          BreakDownClearence,
  BreakDownAcceptance:         BreakDownAcceptance,
  BreakDownApprovalList:       BreakDownApprovalList,
  QCRejectionDetails:          QCRejectionDetails,
  NCApproval:                  NCApproval,
  NCJobCreated:                NCJobCreated,
  NCDCEntry:                   NCDCEntry,
  NCDCDetails:                 NCDCDetails,
  JobList:                     JobList,
  BarcodeDetails:              BarcodeDetails,
  AutoJobEntry:                AutoJobEntry,
  ServiceJobEntryDetails:      ServiceJobEntryDetails,
  ConformationList:            ConformationList,
  ConformationEntryDetails:    ConformationEntryDetails,
  ProcessCard:                 ProcessCard,
  RawMaterialIssue:            RawMaterialIssue,
  RawMaterialIssuedDetails:    RawMaterialIssuedDetails,
  MaterialRequestRejectionList:MaterialRequestRejectionList,
  InwardReports:               InwardReports,
  OutwardDetails:              OutwardDetails,
  MinStock:                    MinStock,
  MaterialIssuedDetails:       MaterialIssuedDetails,
  CompletedJobList:            CompletedJobList,
  PurchaseOrderReport:         PurchaseOrderReport,
  PurchaseOrderOverallReport:  PurchaseOrderOverallReport,
  CurrentStock:                CurrentStock,
  QCCompletedList:             QCCompletedList,
  MaterialIssueCorrection:     MaterialIssueCorrection,
  StockDetails:                StockDetails,
  QCEntryReport:               QCEntryReport,
  CreditSales:                 CreditSales,
  SalesDetails:                SalesDetails,
  QuotationSales:              QuotationSales,
  DCSales:                     DCSales,
  DCDetails:                   DCDetails,
  DCDetailsReport:             DCDetailsReport,
  ServiceBillEntry:            ServiceBillEntry,
  ServiceBillDetails:          ServiceBillDetails,
  ServiceLabourBillDetails:    ServiceLabourBillDetails,
  TempServiceBillDetails:      TempServiceBillDetails,
  DrawingUpload:               DrawingUpload,
  MarketingLog:                MarketingLog,
  ProformaEntry:               ProformaEntry,
  ProformaDetails:             ProformaDetails,
  MarketingReport:             MarketingReport,
  JobCardEntry:                JobCardEntry,
  ProcessMenu:                 ProcessMenu,
  TechAutoJobEntry:            TechAutoJobEntry,
  ViewJobStatus:               ViewJobStatus,
  WaitingForApproval:          WaitingForApproval,
  UpdateRouteDetails:          UpdateRouteDetails,
  RejectedJobList:             RejectedJobList,
  ProcessCompleted:            ProcessCompleted,
  FileUploads:                 FileUploads,
  MRApproval:                  MRApproval,
  JobEntryClosed:              JobEntryClosed,
  JobCardCancel:               JobCardCancel,
  IPRApproval:                 IPRApproval,
  JobQtyMismatch:              JobQtyMismatch,
  ProcessCardClose:            ProcessCardClose,
  JobQCEntry:                  JobQCEntry,
  Users:                       Users,
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

function AppRoutes() {
  return (
    <>
      <NavigationEventBridge />
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {Object.entries(PAGE_COMPONENTS).map(([pageKey, Component]) => {
            const path = PAGE_TO_PATH[pageKey]
            if (!path) return null
            return <Route key={pageKey} path={path} element={<Component />} />
          })}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </>
  )
}

// ─── LOGIN GATE ──────────────────────────────────────────────────────────────
// Set to true  → login page required; users must authenticate
// Set to false → login skipped; app opens directly as admin (dev / demo mode)
const LOGIN_REQUIRED = false
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