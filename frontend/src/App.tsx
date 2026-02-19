import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import ShowroomPage from "./pages/ShowroomPage";
import ProfessionalsPage from "./pages/ProfessionalsPage";
import ReviewsPage from "./pages/ReviewsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CalendarPage from "./pages/CalendarPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import TattooDetailPage from "./pages/TattooDetailPage";
import AdminTattoosPage from "./pages/AdminTattoosPage";
import AdminCompletedAppointmentsPage from "./pages/AdminCompletedAppointmentsPage";


import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Público */}
        <Route path="/" element={<HomePage />} />
        <Route path="/showroom" element={<ShowroomPage />} />
        <Route path="/professionals" element={<ProfessionalsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/showroom/:id" element={<TattooDetailPage />} />

        {/* Privado */}
        <Route element={<ProtectedRoute />}>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/my-appointments" element={<MyAppointmentsPage />} />
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPanelPage />} />
          <Route path="/admin/tattoos" element={<AdminTattoosPage />} />
          <Route path="/admin/appointments/completed" element={<AdminCompletedAppointmentsPage />} />
        </Route>

        <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}