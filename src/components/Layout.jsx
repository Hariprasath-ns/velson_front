import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NAV } from '../config/nav'
import { useAuth } from '../context/AuthContext'
import {
  ChevronRight, ChevronDown, User, LogOut,
} from 'lucide-react'

const PATH_TO_GROUP = {}
for (const item of NAV) {
  if (item.children) {
    for (const child of item.children) {
      if (child.id) {
        PATH_TO_GROUP['/' + item.id + '/' + child.id] = item.id
      }
    }
  }
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { auth, logout } = useAuth()

  const userRole = auth?.user?.role || 'user'
  const userName = auth?.user?.name || 'User'

  const [openGroup, setOpenGroup] = useState(() => PATH_TO_GROUP[pathname] ?? null)

  useEffect(() => {
    const group = PATH_TO_GROUP[pathname]
    if (group) setOpenGroup(group)
  }, [pathname])

  const toggle = id => setOpenGroup(p => (p === id ? null : id))

  const handleLogout = () => {
    logout()
  }

  const HIDDEN_FOR_STAFF = [
    "users",
    "reference-master",
    "system-info-master",
    "db-copy",
    "restore-db",
    "receipt-entry",
    "receipt-details",
    "voucher-entry",
    "day-report",
    "day-book",
    "ledger-balance",
    "monthly-ledger-balance",
    "outstanding-receipt-report",
    "payment-entry",
    "payment-details",
    "journal-entry",
  ];

  const HIDDEN_FOR_USER = [
    ...HIDDEN_FOR_STAFF,
    "company-master", "employee-master", "ledger-group-master", "machine-master", "contractor-master", "process-master", "part-usage-list", "qc-check-method", "qc-inspection-char", "qc-standard-master", "auto-po",
    "part-number-base", "tax-ledger", "tax-master-menu", "item-group", "item-master",
    "supplier-master", "customer-master", "vehicle-master",
    "quotation-entry", "quotation-details", "marketing-log",
    "purchase-order", "purchase-order-details", "purchase-request", "print-purchase-request",
    "material-request", "print-material-request", "gate-entry", "gate-entry-report", "grn-entry", "grn-entry-report",
    "bom-creation", "customerwise-bom-report", "index-creation", "index-creation-report", "upload-bom", "main-index", "main-index-report", "view-model",
    "customer-complaint-entry", "ccms-entry-details", "dc-entry", "dc-details-report",
    "breakdown-approval-list", "nc-approval", "nc-job-created", "nc-dc-entry", "nc-dc-details",
    "barcode-details", "auto-job-entry", "service-job-entry-details", "conformation-list", "conformation-entry-details",
    "job-card-entry", "process-menu", "tech-auto-job", "view-job-status", "waiting-for-approval", "update-route-details", "process-completed", "mr-approval", "nc-job-created", "nc-approval", "ipr-approval", "job-qty-mismatch", "process-card-close", "job-qc-entry",
    "credit-sales", "sales-details", "quotation-sales", "quotation-details", "dc-sales", "dc-details", "service-bill-entry", "service-bill-details", "service-labour-bill-details", "temp-service-bill-details",
  ];

  const userRoleUpper = userRole.toUpperCase();

  const canDisplayModule = (moduleCode) => {
    if (userRoleUpper === "ADMIN" || auth?.user?.id === 0) return true;
    
    if (auth?.user?.permissions && auth?.user?.permissions.length > 0) {
      const perm = auth.user.permissions.find((p) => p.module === moduleCode);
      return perm ? !!perm.canDisplay : false;
    }
    
    if (userRoleUpper === "USER" && HIDDEN_FOR_USER.includes(moduleCode)) return false;
    if (userRoleUpper === "STAFF" && HIDDEN_FOR_STAFF.includes(moduleCode)) return false;
    
    return true;
  };

  // Filter nav items based on custom permissions and hiddenRoles
  const visibleNav = NAV.map(item => {
    const itemCode = item.id.replace(/-top$/, "");
    const isHiddenRole = item.hiddenRoles?.some(r => r.toUpperCase() === userRoleUpper);
    if (isHiddenRole) return null;
    if (!item.children && !canDisplayModule(itemCode)) return null;

    if (item.children) {
      const visibleChildren = item.children.filter(child => {
        const isChildHiddenRole = child.hiddenRoles?.some(r => r.toUpperCase() === userRoleUpper);
        if (isChildHiddenRole) return false;
        return canDisplayModule(child.id);
      });
      if (visibleChildren.length === 0) return null;
      return { ...item, children: visibleChildren };
    }
    return item;
  }).filter(Boolean);

  return (
    <div className="flex h-screen bg-[#f4f6f8] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-[210px] flex-shrink-0 bg-[#1e242e] flex flex-col overflow-y-auto scrollbar-thin">
        {/* Brand */}
        <div className="sticky top-0 px-4 py-[8.9px] bg-[#1e242e] border-b border-white/10 flex-shrink-0">
          <p className="text-white font-extrabold text-[13px] tracking-wide leading-tight">VELSON</p>
          <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase">ERP WEB APPLICATION</p>
        </div>

        <nav className="flex-1 py-1">
          {visibleNav.map(item => {
            const hasChildren = item.children && item.children.length > 0
            const isOpen = openGroup === item.id
            const Icon = item.icon

            if (!hasChildren) {
              const topPath = item.page
                ? '/' + item.id.replace(/-top$/, '')
                : null
              const isActive = topPath && pathname === topPath

              return (
                <button
                  key={item.id}
                  onClick={() => topPath && navigate(topPath)}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] transition-colors
                    ${isActive ? 'bg-[#0097A7] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  {item.label}
                </button>
              )
            }

            return (
              <div key={item.id}>
                <button
                  onClick={() => toggle(item.id)}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-[12.5px] transition-colors
                    ${isOpen ? 'bg-[#0097A7] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={14} className="flex-shrink-0" />
                    {item.label}
                  </span>
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {isOpen && item.children.map(child => {
                  const childPath = '/' + item.id + '/' + child.id
                  const isChildActive = pathname === childPath

                  return (
                    <button
                      key={child.id + '-' + item.id}
                      onClick={() => navigate(childPath)}
                      className={`w-full text-left flex items-center gap-2 pl-8 pr-3 py-2 text-[12px] border-l-[3px] transition-colors
                        ${isChildActive
                          ? 'border-[#00BCD4] bg-[#0097A7]/25 text-white font-semibold'
                          : 'border-transparent text-white/55 hover:bg-white/8 hover:text-white/90'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
                      {child.label}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* ── Right panel ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-[46px] bg-[#1e242e] flex items-center justify-between px-6 flex-shrink-0 shadow-md z-10">
          <span className="text-white font-bold text-[13px] tracking-wider uppercase select-none">
            VELSON - ERP WEB APPLICATION
          </span>
          <div className="flex items-center gap-3">
            <span className="text-white/75 text-[13px]">
              Hi <span className="font-semibold text-white">{userName}</span> !
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0097A7]/40 text-[#7dd3fc] tracking-wide">
              {userRole}
            </span>
            <div className="w-8 h-8 bg-[#0097A7] rounded-full flex items-center justify-center">
              <User size={15} className="text-white" />
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-8 h-8 bg-red-600/70 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <LogOut size={14} className="text-white" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f4f6f8]">
          {children}
        </main>
      </div>
    </div>
  )
}
