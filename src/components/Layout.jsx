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

  // Filter nav items based on hiddenRoles
  const visibleNav = NAV.map(item => {
    if (item.hiddenRoles?.includes(userRole)) return null
    if (item.children) {
      const visibleChildren = item.children.filter(
        child => !child.hiddenRoles?.includes(userRole)
      )
      if (item.children.length > 0 && visibleChildren.length === 0) return null
      return { ...item, children: visibleChildren }
    }
    return item
  }).filter(Boolean)

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
