import { NavLink, HashRouter, Route, Routes } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { ParticipantProvider, useParticipant } from "./context/ParticipantContext";
import Dashboard from "./pages/Dashboard";
import Picks from "./pages/Picks";
import Ranking from "./pages/Ranking";
import Departments from "./pages/Departments";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Invites from "./pages/Invites";
import AcceptInvite from "./pages/AcceptInvite";
import Login from "./pages/Login";

const NAV_ITEMS = [
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/palpites", icon: "sports_soccer", label: "Meus Palpites" },
  { to: "/ranking", icon: "leaderboard", label: "Ranking" },
  { to: "/chat", icon: "forum", label: "Chat" },
  { to: "/departamentos", icon: "groups", label: "Departamentos" },
];

const ADMIN_NAV_ITEMS = [
  { to: "/admin", icon: "settings", label: "Administracao" },
  { to: "/convites", icon: "mail", label: "Convites" },
];

function SideNav() {
  const { participant, logout } = useParticipant();
  const { isAuthenticated: isAdmin } = useAdminAuth();
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-surface-dim/80 backdrop-blur-xl border-r border-white/10 shadow-2xl shadow-primary/10 flex-col py-8 px-4 z-50">
      <div className="mb-12 text-center">
        <h2 className="font-display-lg-mobile text-display-lg-mobile text-primary italic tracking-tighter m-0">
          Copa AMM 2026
        </h2>
        <p className="font-label-md text-label-md text-on-surface-variant mt-2">Temporada de Pontos</p>
      </div>
      <nav className="flex-1 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-300 active:scale-95 hover:shadow-[0_0_15px_rgba(101,223,118,0.3)] group ${
                isActive
                  ? "bg-primary/20 text-primary border-r-4 border-primary font-bold"
                  : "text-on-surface-variant/70 hover:text-on-surface hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined mr-3 group-hover:text-primary${isActive ? " icon-filled" : ""}`}>
                  {item.icon}
                </span>
                <span className="font-label-md text-label-md">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-2">
        <NavLink
          to="/palpites"
          className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-lg glow-button font-bold flex items-center justify-center"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Novo Palpite
        </NavLink>
        {participant ? (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-error/80 hover:text-error text-sm py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sair
          </button>
        ) : (
          <NavLink
            to="/entrar"
            className="w-full flex items-center justify-center gap-2 text-primary border border-primary/40 hover:bg-primary/10 text-sm py-2 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-base">login</span>
            Entrar
          </NavLink>
        )}
      </div>
    </aside>
  );
}

function TopAppBar() {
  const { participant } = useParticipant();
  const label = participant
    ? participant.name
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : "?";

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-surface-container-low/30 backdrop-blur-md shadow-sm h-20 w-full flex justify-between items-center px-margin-mobile md:px-margin-desktop">
      <div className="flex items-center md:hidden">
        <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary font-black m-0">Copa AMM 2026</h1>
      </div>
      <div className="hidden md:flex flex-1 justify-end items-center space-x-6">
        <div className="flex items-center space-x-4">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          <div className="h-10 w-10 rounded-full bg-surface-bright flex items-center justify-center border-2 border-primary/30 font-bold text-sm">
            {label}
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-highest/90 backdrop-blur-md z-50 px-2 py-3 flex justify-around items-center glass-panel rounded-t-xl">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center p-2 ${isActive ? "text-primary font-bold" : "text-on-surface-variant"}`
          }
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="text-[10px] font-label-md mt-1">{item.label.split(" ")[0]}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/** Sem convite aceito, o app continua navegável (ranking, admin, convites) —
 * só apostar (Picks) e a personalização do Dashboard pedem participante. */
function Shell() {
  return (
    <div className="min-h-screen">
      <SideNav />
      <TopAppBar />
      <BottomNav />
      <main className="pt-24 pb-24 md:pb-8 md:pl-72 pr-4 md:pr-margin-desktop min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/palpites" element={<Picks />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/departamentos" element={<Departments />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/convites" element={<Invites />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <ParticipantProvider>
        <HashRouter>
          <Routes>
            <Route path="/convite/:token" element={<AcceptInvite />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/entrar/:token" element={<Login />} />
            <Route path="/*" element={<Shell />} />
          </Routes>
        </HashRouter>
      </ParticipantProvider>
    </AdminAuthProvider>
  );
}
