import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { changeMyPassword, getMe, updateMe } from "../api/userAccountApi";
import { useAuth } from "../auth/AuthContext";
import type { UserAccountUpdateDto } from "../types/userAccount";
import "../styles/account.css";

type Props = {
  embedded?: boolean;
};

export default function MyProfilePage({ embedded = false }: Props) {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState<UserAccountUpdateDto>({
    email: "",
    phone: "",
    showPhoto: false,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const load = async () => {
    if (!token) return;

    setError("");
    setOk("");
    setLoading(true);

    try {
      const me = await getMe(token);
      setForm({
        email: me.email ?? "",
        phone: me.phone ?? "",
        showPhoto: !!me.showPhoto,
      });
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: "/my-account" } });
        return;
      }
      setError(e?.message || "Error cargando tus datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      nav("/login", { replace: true, state: { from: "/my-account" } });
      return;
    }
    if (role !== "CLIENT") {
      nav("/", { replace: true });
      return;
    }
    load();
  }, [token, role]);

  const validateProfile = () => {
    if (!form.email.trim()) return "El email es obligatorio.";
    if (!form.email.includes("@")) return "Email no válido.";
    return null;
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    setOk("");

    const msg = validateProfile();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      await updateMe(token, {
        email: form.email.trim(),
        phone: form.phone ? form.phone.trim() : "",
        showPhoto: !!form.showPhoto,
      });

      setOk(
        "Datos actualizados. Si cambiaste el email, puede que tengas que volver a iniciar sesión."
      );
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        setError("Ese email ya está registrado.");
        return;
      }
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: "/my-account" } });
        return;
      }
      setError(e?.message || "Error guardando tus datos");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    if (!currentPassword.trim()) return "La contraseña actual es obligatoria.";
    if (!newPassword.trim()) return "La nueva contraseña es obligatoria.";
    if (newPassword !== newPassword2) return "Las nuevas contraseñas no coinciden.";
    return null;
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    setOk("");

    const msg = validatePassword();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      await changeMyPassword(token, { currentPassword, newPassword });
      setOk("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 400) {
        setError("La contraseña actual no es correcta.");
        return;
      }
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: "/my-account" } });
        return;
      }
      setError(e?.message || "Error cambiando la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!embedded ? (
        <>
          <h1 className="account-section-title">Gestionar mis datos</h1>
          <p className="account-section-text">
            Actualiza tu email, tu teléfono y tus preferencias de privacidad.
          </p>
        </>
      ) : (
        <>
          <h2 className="account-section-title">Gestionar mis datos</h2>
          <p className="account-section-text">
            Actualiza tu email, tu teléfono y tus preferencias de privacidad.
          </p>
        </>
      )}

      {(error || ok) && (
        <div
          className={`account-feedback ${
            error ? "account-feedback--error" : "account-feedback--success"
          }`}
        >
          {error || ok}
        </div>
      )}

      <form onSubmit={onSaveProfile} className="account-form-grid" style={{ marginTop: "1.25rem" }}>
        <label className="account-field">
          <span className="account-field__label">Email</span>
          <input
            className="input"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            disabled={loading}
          />
        </label>

        <label className="account-field">
          <span className="account-field__label">Teléfono (opcional)</span>
          <input
            className="input"
            value={form.phone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            disabled={loading}
            placeholder="Ej: 600123123"
          />
        </label>

        <label className="account-checkbox">
          <input
            type="checkbox"
            checked={!!form.showPhoto}
            onChange={(e) => setForm((f) => ({ ...f, showPhoto: e.target.checked }))}
            disabled={loading}
          />
          <span>
            Doy consentimiento para que mis tatuajes puedan mostrarse en la web.
          </span>
        </label>

        <div className="account-inline-actions">
          <button type="submit" className="account-btn account-btn--primary" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            className="account-btn account-btn--ghost"
            onClick={load}
            disabled={loading}
          >
            Recargar
          </button>
        </div>
      </form>

      <hr className="account-divider" />

      <h3 className="account-subtitle">Cambiar contraseña</h3>

      <form onSubmit={onChangePassword} className="account-form-grid">
        <label className="account-field">
          <span className="account-field__label">Contraseña actual</span>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
          />
        </label>

        <label className="account-field">
          <span className="account-field__label">Nueva contraseña</span>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </label>

        <label className="account-field">
          <span className="account-field__label">Repite nueva contraseña</span>
          <input
            className="input"
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            disabled={loading}
          />
        </label>

        <div className="account-inline-actions">
          <button type="submit" className="account-btn account-btn--primary" disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </div>
      </form>
    </div>
  );
}