import { NavLink, Outlet } from "react-router-dom";
import { Text } from "@fluentui/react-components";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/submit", label: "Share an idea" },
  { to: "/ideas", label: "Browse & vote" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/qr", label: "QR code" },
];

export default function Layout() {
  return (
    <div className="shell">
      <header className="header">
        <div className="brand">
          <NavLink to="/" className="brand-logo" aria-label="KONE home">
            <img src="/kone-logo.svg" alt="KONE" width={104} height={41} />
          </NavLink>
          <Text weight="semibold" size={500}>
            AI Agent Use Case Discovery Workshop
          </Text>
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : undefined)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <Text size={200}>Use Case Discovery Workshop</Text>
        <NavLink to="/admin">Facilitator area</NavLink>
      </footer>
    </div>
  );
}
