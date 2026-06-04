export default function AppMinimalWorking() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#2563eb' }}>🚀 SIGAH FUNCIONA</h1>
      <p>Si ves esto, React está funcionando correctamente.</p>
      <div style={{ backgroundColor: '#e8f5e8', padding: '10px', margin: '10px 0' }}>
        <h2>✅ Credenciales de Acceso:</h2>
        <p><strong>Email:</strong> admin@sigah.com</p>
        <p><strong>Contraseña:</strong> admin123</p>
      </div>
      <button onClick={() => alert('Sistema SIGAH funcionando!')}>
        Probar Sistema
      </button>
    </div>
  );
}
