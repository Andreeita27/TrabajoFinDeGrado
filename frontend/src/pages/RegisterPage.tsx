import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/auth.css";

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

      nav("/", { replace: true });
    } catch (err: any) {
      setMsg(err?.message || "Error en registro");
    }
  };

  return (
    <div className="container authWrap">
      <div className="card authCard">
        <div className="authHeader">
          <h1 className="authTitle">Registro</h1>
          <p className="authSubtitle">
            Crea tu cuenta para reservar citas.
          </p>
        </div>

        {msg && <div className="authMsg">{msg}</div>}

        <form onSubmit={onSubmit} className="authForm">
          <div className="row2">
            <input
              className="input"
              placeholder="Nombre"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Apellidos"
              value={clientSurname}
              onChange={(e) => setClientSurname(e.target.value)}
            />
          </div>

          <div className="row2">
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="input"
              placeholder="Teléfono (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="field">
            <div className="fieldTitle">Fecha de nacimiento (opcional)</div>
            <input
              className="input"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <div className="hint">
              Esto solo se usa para tu ficha de cliente (no es obligatorio).
            </div>
          </div>

          <label className="checkboxRow">
            <input
              type="checkbox"
              checked={showPhoto}
              onChange={(e) => setShowPhoto(e.target.checked)}
            />
            <span>Permito que mis tatuajes se enseñen en la web</span>
          </label>

          <div className="row2">
            <input
              className="input"
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <input
              className="input"
              placeholder="Repite contraseña"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="authActions">
            <button type="submit" className="btn btn-primary">
              Crear cuenta
            </button>
            <Link to="/login" className="btn btn-ghost">
              Ya tengo cuenta
            </Link>
          </div>
        </form>

        <p className="authFooter">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}