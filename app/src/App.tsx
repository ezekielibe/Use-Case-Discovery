import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Submit from "./pages/Submit";
import Browse from "./pages/Browse";
import Leaderboard from "./pages/Leaderboard";
import QrCode from "./pages/QrCode";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="submit" element={<Submit />} />
        <Route path="ideas" element={<Browse />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="qr" element={<QrCode />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
