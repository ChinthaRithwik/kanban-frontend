import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { loginUser }  from '../api/authApi';
import { LayoutDashboard, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const { login }  = useContext(AuthContext);
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res   = await loginUser({ email, password });
      const token = res.data.token;
      sessionStorage.setItem('token', token);
      login(token);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20
      flex flex-col justify-center items-center py-12 px-4">

      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8 animate-fade-up">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center
          shadow-lg shadow-blue-200">
          <LayoutDashboard size={28} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">KanbanFlow</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sign in to your workspace</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md animate-card-in">
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgb(0,0,0,0.12)]
          border border-gray-100 p-8">

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Error alert */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200
                text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-up">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200
                    rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2
                    focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200
                    rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2
                    focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex items-center justify-center gap-2 py-3 px-4
                rounded-xl text-white bg-blue-600 hover:bg-blue-700
                font-bold text-sm transition-all duration-200
                shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200
                disabled:opacity-60 disabled:cursor-not-allowed
                mt-1
              "
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
