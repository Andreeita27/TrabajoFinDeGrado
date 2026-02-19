export default function AdminPanelPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Panel Admin</h1>
      <p>Endpoints admin disponibles en el backend:</p>
      <ul>
        <li>GET /appointments (con filtros)</li>
        <li>POST /appointments/{'{id}'}/mark-no-show</li>
        <li>CRUD /tattoos</li>
        <li>CRUD /professionals</li>
        <li>CRUD /clients (requiere auth por SecurityConfig)</li>
      </ul>
    </div>
  );
}
