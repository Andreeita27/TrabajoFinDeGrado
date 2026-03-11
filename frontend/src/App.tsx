import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import ShowroomPage from "./pages/ShowroomPage";
import ProfessionalsPage from "./pages/ProfessionalsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CalendarPage from "./pages/CalendarPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import TattooDetailPage from "./pages/TattooDetailPage";
import AdminAppointmentsPage from "./pages/AdminAppointmentsPage";
import AdminTattooCreatePage from "./pages/AdminTattooCreatePage";
import AdminTattooEditPage from "./pages/AdminTattooEditPage";
import MyAccountPage from "./pages/MyAccountPage";
import AdminAvailabilityPage from "./pages/AdminAvailabilityPage";
import AppointmentDetailPage from "./pages/AppointmentDetailPage";
import ProfessionalDetailPage from "./pages/ProfessionalDetailPage";
import LaserPage from "./pages/LaserPage";

import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";

import Footer from "./components/Footer";


export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />

      <Routes>
        {/* Público */}
        <Route path="/" element={<HomePage />} />
        <Route path="/showroom" element={<ShowroomPage />} />
        <Route path="/professionals" element={<ProfessionalsPage />} />
        <Route path="/laser" element={<LaserPage/>} />
        <Route path="/showroom/:id" element={<TattooDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/professionals/:id" element={<ProfessionalDetailPage />} />

        {/* Privado */}
        <Route element={<ProtectedRoute />}>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/my-appointments" element={<MyAppointmentsPage />} />
          <Route path="/my-account" element={<MyAccountPage />} />
          <Route path="/my-appointments/:id" element={<AppointmentDetailPage />} />
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPanelPage />} />
          <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
          <Route path="/admin/availability" element={<AdminAvailabilityPage />} />
          <Route path="/admin/appointments/:id" element={<AppointmentDetailPage />} />

          <Route path="/admin/appointments/:id/tattoo/new" element={<AdminTattooCreatePage />} />
          <Route path="/admin/tattoos/:id/edit" element={<AdminTattooEditPage />} />
        </Route>

        <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}