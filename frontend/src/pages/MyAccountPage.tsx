import { useState } from "react";
import MyAppointmentsPage from "./MyAppointmentsPage";
import MyProfilePage from "./MyProfilePage";

type Tab = "APPOINTMENTS" | "PROFILE";

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "10px 14px",
  border: "1px solid #333",
  background: active ? "#222" : "transparent",
  color: active ? "white" : "#ddd",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: active ? 700 : 600,
});

export default function MyAccountPage() {
  const [tab, setTab] = useState<Tab>("APPOINTMENTS");

  return (
    <div style={{ padding: 16 }}>
      <h1>Mi cuenta</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setTab("APPOINTMENTS")}
          style={tabBtn(tab === "APPOINTMENTS")}
        >
          Gestionar mis citas
        </button>

        <button
          type="button"
          onClick={() => setTab("PROFILE")}
          style={tabBtn(tab === "PROFILE")}
        >
          Gestionar mis datos
        </button>
      </div>

      {tab === "APPOINTMENTS" ? <MyAppointmentsPage embedded /> : <MyProfilePage embedded />}
    </div>
  );
}