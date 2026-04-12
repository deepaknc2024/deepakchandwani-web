import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="pt-[58px]">
        <Outlet />
      </main>
      <Footer />
    </AuthProvider>
  );
}
