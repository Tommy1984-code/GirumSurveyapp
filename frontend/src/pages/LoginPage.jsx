import React from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import { checkAuth, login, register } from '../services/api';
import { SESSION_TOKEN_KEY, ADMIN_USER_KEY } from '../constants';

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [hasUsers, setHasUsers] = React.useState(null);

  React.useEffect(() => {
    async function checkUsers() {
      try {
        const data = await checkAuth();
        if (data) setHasUsers(data.has_users);
      } catch (e) {
        setHasUsers(true);
      }
    }
    checkUsers();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, email, password);
        const data = await login(username, password);
        localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
        onLogin(data.token, data.user);
      } else {
        const data = await login(username, password);
        localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
        onLogin(data.token, data.user);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (hasUsers === null) {
    return (
      <div className="min-h-screen login-bg flex items-center justify-center p-4">
        <ClipLoader color="#ffffff" size={40} />
      </div>
    );
  }

  const showRegister = !hasUsers;

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
          <div className="text-center mb-8">
            <div className="w-[216px] mx-auto mb-5">
              <img src="/image/girum-logo.png" alt="Girum Logo" className="w-full h-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">{showRegister ? 'Create your admin account' : 'Sign in to your account'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-gray-100/80 backdrop-blur border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 outline-none focus:bg-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                placeholder="Username"
                required
              />
            </div>
            
            {showRegister && (
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-100/80 backdrop-blur border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 outline-none focus:bg-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                  placeholder="Email"
                  required
                />
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-gray-100/80 backdrop-blur border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 outline-none focus:bg-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all pr-12"
                placeholder="Password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-cyan-200 mt-4"
            >
              {loading ? 'Please wait...' : (showRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
