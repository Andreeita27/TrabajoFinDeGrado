import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getAllTattoos,
  createTattoo,
  updateTattoo,
  deleteTattoo
} from "../api/tattoosApi";
import type { TattooDto } from "../types/tattoo";

export default function AdminTattoosPage() {
  const { token } = useAuth();

  const [items, setItems] = useState<TattooDto[]>([]);
  const [editing, setEditing] = useState<TattooDto | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Omit<TattooDto, "id">>({
    clientId: 1,
    professionalId: 1,
    professionalName: "",
    tattooDate: "",
    style: "",
    tattooDescription: "",
    imageUrl: "",
    sessions: 1,
    coverUp: false,
    color: false
  });

  const load = () => {
    getAllTattoos()
      .then(setItems)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editing) {
        await updateTattoo(token, editing.id, { ...editing });
      } else {
        await createTattoo(token, form);
      }

      setEditing(null);
      setForm({
        clientId: 1,
        professionalId: 1,
        professionalName: "",
        tattooDate: "",
        style: "",
        tattooDescription: "",
        imageUrl: "",
        sessions: 1,
        coverUp: false,
        color: false
      });

      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Seguro que quieres eliminar este tattoo?")) return;

    await deleteTattoo(token, id);
    load();
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Gestión de Tattoos</h1>

      {error && <div style={{ color: "tomato" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 400 }}>
        <input
          placeholder="Descripción"
          value={editing ? editing.tattooDescription : form.tattooDescription}
          onChange={(e) =>
            editing
              ? setEditing({ ...editing, tattooDescription: e.target.value })
              : setForm({ ...form, tattooDescription: e.target.value })
          }
        />

        <input
          placeholder="Estilo"
          value={editing ? editing.style : form.style}
          onChange={(e) =>
            editing
              ? setEditing({ ...editing, style: e.target.value })
              : setForm({ ...form, style: e.target.value })
          }
        />

        <input
          placeholder="Image URL"
          value={editing ? editing.imageUrl : form.imageUrl}
          onChange={(e) =>
            editing
              ? setEditing({ ...editing, imageUrl: e.target.value })
              : setForm({ ...form, imageUrl: e.target.value })
          }
        />

        <input
          type="date"
          value={editing ? editing.tattooDate : form.tattooDate}
          onChange={(e) =>
            editing
              ? setEditing({ ...editing, tattooDate: e.target.value })
              : setForm({ ...form, tattooDate: e.target.value })
          }
        />

        <button type="submit">
          {editing ? "Actualizar" : "Crear"}
        </button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      <ul>
        {items.map((t) => (
          <li key={t.id}>
            {t.tattooDescription} — {t.style}

            <button onClick={() => setEditing(t)}>Editar</button>
            <button onClick={() => handleDelete(t.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}