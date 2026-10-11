import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  Compass,
  ShieldCheck,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const NAV_LINKS = [
  { to: "/flights", label: "Flights" },
  { to: "/hotels", label: "Hotels" },
  { to: "/packages", label: "Packages" },
  { to: "/destinations", label: "Destinations" },
  { to: "/plan", label: "AI Planner" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ivory/95 backdrop-blur dark:border-indigo-800 dark:bg-indigo-950/95">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-xl tracking-wide text-indigo-900 dark:text-ivory"
        >
          <Compass className="h-5 w-5 text-gold" aria-hidden="true" />
          AERLUME
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-indigo-900 dark:text-ivory"
                    : "text-muted dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-ivory"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={toggleTheme}
            className="rounded p-2 text-muted dark:text-indigo-300 hover:bg-indigo-50 hover:text-indigo-900 dark:hover:bg-indigo-800 dark:hover:text-ivory"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          {user ? (
            <>
              <NotificationBell />
              {user.role === "admin" && (
                <Link to="/admin" className="btn-ghost">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin
                </Link>
              )}
              <Link to="/dashboard" className="btn-outline">
                <User className="h-4 w-4" aria-hidden="true" />
                {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="btn-ghost"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn-accent">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-ivory px-4 pb-4 dark:border-indigo-800 dark:bg-indigo-950 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block py-2.5 text-sm font-medium text-indigo-900 dark:text-ivory"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="btn-outline w-full justify-center"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-outline w-full justify-center"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline w-full justify-center">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-accent w-full justify-center"
                >
                  Sign up
                </Link>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="btn-outline"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
