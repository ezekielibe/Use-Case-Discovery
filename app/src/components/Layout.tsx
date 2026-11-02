import { NavLink, Outlet } from "react-router-dom";
import { Text } from "@fluentui/react-components";
import { BotSparkleRegular } from "@fluentui/react-icons";

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
          <BotSparkleRegular fontSize={28} />
          <Text weight="semibold" size={500}>
            Copilot Studio Use Case Discovery
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
