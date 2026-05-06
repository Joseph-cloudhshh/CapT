import { Outlet, Link, useLocation } from "react-router-dom";
import { BarChart2, Crosshair, Layers, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/", label: "Market Pulse", icon: BarChart2 },
  { path: "/nexus", label: "The Nexus", icon: Crosshair },
  { path: "/nft", label: "NFT Gallery", icon: Layers },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[700px] h-[700px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(120,140,170,0.08) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(212,175,55,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-subtle gold-border flex items-center justify-center gold-glow">
              <Zap className="w-5 h-5 text-gold" fill="rgba(212,175,55,0.3)" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold text-gradient tracking-widest">CapT</span>
              <span className="font-display text-[10px] text-steel-light tracking-[0.3em] uppercase">Intel</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-sans",
                    active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-gold-subtle gold-border gold-glow"
                      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                    />
                  )}
                  <item.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass gold-border">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-steel-light font-mono tracking-wider">LIVE</span>
            </div>
            <button className="md:hidden p-2 rounded-lg glass gold-border" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5 text-gold" /> : <Menu className="w-5 h-5 text-gold" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-gold/10 overflow-hidden">
              <div className="px-4 py-3 space-y-1">
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                      className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all", active ? "bg-gold-subtle gold-border text-gold" : "text-muted-foreground hover:text-foreground")}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10 pt-20 pb-8 px-4 sm:px-6 max-w-[1440px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}