export default function AppSimpleTest() {
  return (
    <div>
      <h1 style={{ color: 'red', fontSize: '48px' }}>🚀 SIGAH FUNCIONA</h1>
      <p style={{ fontSize: '24px' }}>Si ves esto, React está funcionando</p>
      <button onClick={() => alert('Click funciona!')}>
        Probar Click
      </button>
    </div>
  );
}
