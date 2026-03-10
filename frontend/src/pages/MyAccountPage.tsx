import { useState } from "react";
import MyAppointmentsPage from "./MyAppointmentsPage";
import MyProfilePage from "./MyProfilePage";
import "../styles/account.css";

type Tab = "APPOINTMENTS" | "PROFILE";

export default function MyAccountPage() {
  const [tab, setTab] = useState<Tab>("APPOINTMENTS");

  return (
    <div className="account-page">
      <header className="account-hero">
        <p className="account-hero__kicker">Área privada</p>
        <h1 className="account-hero__title">Mi cuenta</h1>
        <p className="account-hero__text">
          Desde aquí puedes gestionar tus citas, revisar tu información personal
          y mantener tu perfil al día de forma cómoda.
        </p>
      </header>

      <div className="account-tabs">
        <button
          type="button"
          onClick={() => setTab("APPOINTMENTS")}
          className={`account-tab ${tab === "APPOINTMENTS" ? "account-tab--active" : ""}`}
        >
          Gestionar mis citas
        </button>

        <button
          type="button"
          onClick={() => setTab("PROFILE")}
          className={`account-tab ${tab === "PROFILE" ? "account-tab--active" : ""}`}
        >
          Gestionar mis datos
        </button>
      </div>

      <section className="account-panel">
        {tab === "APPOINTMENTS" ? (
          <MyAppointmentsPage embedded />
        ) : (
          <MyProfilePage embedded />
        )}
      </section>
    </div>
  );
}