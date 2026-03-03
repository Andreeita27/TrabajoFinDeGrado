import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    try {
      await login({ email, password });
      nav(from, { replace: true });
    } catch (err: any) {
      setMsg(err?.message || "Error en login");
    }
  };

  return (
    <div className="container authWrap">
      <div className="card authCard">
        <div className="authHeader">
          <h1 className="authTitle">Iniciar sesión</h1>
          <p className="authSubtitle">
            Accede a tu cuenta para reservar y gestionar tus citas.
          </p>
        </div>

        {msg && <div className="authMsg">{msg}</div>}

        <form onSubmit={onSubmit} className="authForm">
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            className="input"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="authActions">
            <button type="submit" className="btn btn-primary">
              Entrar
            </button>
            <Link to="/register" className="btn btn-ghost">
              Crear cuenta
            </Link>
          </div>
        </form>

        <p className="authFooter">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}