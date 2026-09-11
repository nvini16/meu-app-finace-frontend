import { Navigate, Route, Routes, NavLink } from 'react-router-dom';
import Login from './components/Login';
import Lancamentos from './components/Lancamentos';
import Perfil from './components/Perfil';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function Dashboard() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="max-w-7xl w-full mx-auto px-4 py-4 flex justify-between items-center border-b border-slate-900">
        <img
  src="/publicpwa-512x512.png"
  alt="Alvocapital"
  className="w-20 h-20 object-contain drop-shadow-[0_0_16px_rgba(52,211,153,0.3)]"
/>

        <nav className="flex items-center gap-2">
          <NavLink 
            to="/lancamentos"
            className={({ isActive }) => 
              isActive 
                ? 'scale-110 brightness-125 drop-shadow-[0_0_8px_rgba(52,211,153,0.55)] transation-all duration-200' 
                : 'transation-all duration-200'}
          >
            <img 
              src="/lancamentos.png" 
              alt="Lançamentos" 
              className="h-10 w-10 "
              />
          </NavLink>

          <NavLink 
            to="/perfil"
            className={({ isActive}) => 
              isActive 
                ? 'scale-110 brightness-125 drop-shadow-[0_0_8px_rgba(52,211,153,0.55)] transation-all duration-200' 
                : 'transation-all duration-200'}  
          >
            <img 
              src="/configuracao.png" 
              alt="Perfil" 
              className="h-10 w-10 "
              />
          </NavLink>
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
