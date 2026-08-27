import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-medium">
        Carregando Seu Alvocapital...
      </div>
    );
  }

  if (!session) {
    window.location.replace('/login');
    return null;
  }

  return children;
}
