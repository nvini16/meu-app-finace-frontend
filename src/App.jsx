import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Lancamentos from './components/Lancamentos';
import Perfil from './components/Perfil';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function Dashboard() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="max-w-7xl w-full mx-auto px-4 py-4 flex justify-between items-center border-b border-slate-900">
        <h1 className="text-xl font-bold text-emerald-400">Alvocapital</h1>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => navigate('/lancamentos')}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80 cursor-pointer"
          >
            Lançamentos
          </button>
          <button
            onClick={() => navigate('/perfil')}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80 cursor-pointer"
          >
            Configurações
          </button>
          {/* <button
            onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-red-400 hover:text-red-300 cursor-pointer"
          >
            Sair
          </button> */}
        </nav>
      </header>

      <main className="flex-1 py-6">
        <Routes>
          <Route index element={<Navigate to="/lancamentos" replace />} />
          <Route path="lancamentos" element={<Lancamentos session={session} />} />
          <Route path="perfil" element={<Perfil session={session} />} />
          <Route path="*" element={<Navigate to="/lancamentos" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/lancamentos" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
