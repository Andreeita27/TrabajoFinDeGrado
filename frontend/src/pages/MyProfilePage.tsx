import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { changeMyPassword, getMe, updateMe } from "../api/userAccountApi";
import { useAuth } from "../auth/AuthContext";
import type { UserAccountUpdateDto } from "../types/userAccount";

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

  // Password form separado
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

      setOk("Datos actualizados");
      setOk((prev) => prev + " (Si cambiaste el email, puede que tengas que volver a iniciar sesión).");
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
    <div style={{ padding: embedded ? 0 : 16, maxWidth: 720 }}>
      {!embedded ? (
        <h1>Gestionar mis datos</h1>
      ) : (
        <h2 style={{ marginTop: 0 }}>Gestionar mis datos</h2>
      )}

      {error && <div style={{ color: "tomato", marginBottom: 10 }}>{error}</div>}
      {ok && <div style={{ color: "lightgreen", marginBottom: 10 }}>{ok}</div>}

      <form onSubmit={onSaveProfile} style={{ display: "grid", gap: 12, marginBottom: 18 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Email
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            disabled={loading}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Teléfono (opcional)
          <input
            value={form.phone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            disabled={loading}
            placeholder="Ej: 600123123"
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={!!form.showPhoto}
            onChange={(e) => setForm((f) => ({ ...f, showPhoto: e.target.checked }))}
            disabled={loading}
          />
          Doy consentimiento para que mis tatuajes puedan mostrarse en la web.
        </label>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          <button type="button" onClick={load} disabled={loading}>
            Recargar
          </button>
        </div>
      </form>

      <hr style={{ margin: "16px 0" }} />

      <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>
      <form onSubmit={onChangePassword} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Contraseña actual
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Nueva contraseña
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Repite nueva contraseña
          <input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            disabled={loading}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}