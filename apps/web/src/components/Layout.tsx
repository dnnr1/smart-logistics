import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Bot, LayoutDashboard, Package, ShieldAlert } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/deliveries", label: "Deliveries", icon: Package, end: false },
  { to: "/risk", label: "Risk analysis", icon: ShieldAlert, end: false },
  { to: "/assistant", label: "AI assistant", icon: Bot, end: false },
];

export function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="rounded-lg bg-brand-600 p-1.5 text-white">
            <BarChart3 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold">Smart Logistics</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-xs text-slate-400">Fictional data · v0.1.0</div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-8">
        <Outlet />
      </main>
    </div>
  );
}
