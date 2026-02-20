import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [clientName, setClientName] = useState("");
  const [clientSurname, setClientSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showPhoto, setShowPhoto] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (password !== confirm) {
      setMsg("Las contraseñas no coinciden");
      return;
    }

    try {
      await register({
        clientName,
        clientSurname,
        email,
        phone: phone || undefined,
        birthDate: birthDate || undefined,
        showPhoto,
        password,
      });

      nav("/calendar", { replace: true });
    } catch (err: any) {
      setMsg(err?.message || "Error en registro");
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 520 }}>
      <h1>Registro</h1>

      {msg && <div style={{ margin: "8px 0", color: "tomato" }}>{msg}</div>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Nombre" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        <input placeholder="Apellidos" value={clientSurname} onChange={(e) => setClientSurname(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label style={{ display: "grid", gap: 6 }}>
          Fecha de nacimiento (opcional)
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} />
          Permito que mis tatuajes se enseñen en la web
        </label>

        <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input
          placeholder="Repite contraseña"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button type="submit">Crear cuenta</button>
      </form>

      <p style={{ marginTop: 12 }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
