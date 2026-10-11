import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Plane, Hotel, Map, ClipboardList, BarChart3 } from 'lucide-react';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/flights', label: 'Flights', icon: Plane },
  { to: '/admin/hotels', label: 'Hotels', icon: Hotel },
  { to: '/admin/packages', label: 'Packages', icon: Map },
  { to: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminLayout() {
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">Admin console</h1>
      <div className="horizon-rule mt-3" />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-indigo-900 text-ivory' : 'text-muted dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-800 hover:text-indigo-900 dark:hover:text-ivory'
                }`
              }
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
