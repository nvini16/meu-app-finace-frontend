import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Alterna entre Login e Cadastro

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // Fluxo de Cadastro
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(`Erro no cadastro: ${error.message}`);
      else alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.');
    } else {
      // Fluxo de Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(`Erro no login: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-emerald-400 mb-2">Alvocapital</h2>
        <p className="text-slate-400 text-center mb-6 text-sm">
          {isSignUp ? 'Crie sua conta gratuitamente' : 'Controle suas finanças pessoais'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
            <input
              type="password"
              placeholder="Senha segura"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'} {' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-emerald-400 hover:underline font-medium"
          >
            {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}