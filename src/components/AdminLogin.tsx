import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Info } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onGoToVisitor: () => void;
  logoElement: React.ReactNode;
}

export default function AdminLogin({ onLoginSuccess, onGoToVisitor, logoElement }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess();
      } else {
        setError(data.error || 'Invalid admin credentials!');
      }
    })
    .catch((err) => {
      console.error(err);
      setError('Unable to reach the admin login service. Please try again.');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col relative overflow-hidden font-sans">
      
      {/* Top Header - Matches Screenshots */}
      <header className="p-6 flex items-center justify-between w-full z-10">
        <div className="flex items-center space-x-3">
          {logoElement}
        </div>
        <div className="flex-1 text-center pr-12">
          <h1 className="text-3xl md:text-4xl font-black text-red-600 tracking-wide">
            Union Voter Admin Control
          </h1>
        </div>
      </header>

      {/* Main Login Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 relative">
        
        {/* Beautiful purple/indigo forest/mountain illustration container mimicking Screenshot 1 */}
        <div className="relative w-full max-w-lg bg-gradient-to-b from-[#7c4d9b] via-[#4d3275] to-[#241743] rounded-[40px] shadow-2xl p-8 md:p-10 text-white overflow-hidden border border-[#9b72be]/30">
          
          {/* Mock Forest Silhouettes at the bottom representing the background image */}
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none opacity-30 select-none">
            <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full text-slate-900 fill-current">
              <path d="M0,224L120,192C240,160,480,96,720,96C960,96,1200,160,1320,192L1440,224L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
            </svg>
            <div className="absolute bottom-0 left-4 right-4 flex justify-between items-end text-purple-200">
              {/* Simple stylized pine tree icons */}
              <div className="flex space-x-1">
                <span className="text-xl">🌲</span>
                <span className="text-2xl">🌲</span>
              </div>
              <div className="flex space-x-2">
                <span className="text-2xl">🌲</span>
                <span className="text-xl">🌲</span>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            {/* Title */}
            <h2 className="text-4xl font-extrabold text-center mb-6 tracking-wider">
              Admin Login
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-500/40 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input with white bottom underline style */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-semibold text-purple-200 uppercase tracking-widest pl-1">
                  Email
                </label>
                <div className="relative border-b-2 border-purple-300/60 focus-within:border-white transition-all py-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@yourdomain.com"
                    className="w-full bg-transparent pl-2 pr-8 py-1.5 outline-none text-white placeholder-purple-300/50 text-base"
                    required
                  />
                  <Mail className="absolute right-2 top-2.5 text-purple-300/70" size={18} />
                </div>
              </div>

              {/* Password Input with white bottom underline style */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-semibold text-purple-200 uppercase tracking-widest pl-1">
                  Password
                </label>
                <div className="relative border-b-2 border-purple-300/60 focus-within:border-white transition-all py-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent pl-2 pr-16 py-1.5 outline-none text-white placeholder-purple-300/50 text-base tracking-wide"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1.5 bg-[#3b7fa4]/80 hover:bg-[#3b7fa4] text-xs font-bold px-3 py-1 rounded-md text-white transition border border-[#ffffff]/20"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Remember Me and Actions */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-purple-200">Remember Me</span>
                </label>
              </div>

              {/* Login Button - Large White Pill */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-white text-slate-900 font-extrabold text-lg hover:bg-slate-100 active:scale-[0.98] transition-all shadow-xl hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Log in</span>
                  )}
                </button>
              </div>

              {/* Back to Visitor Button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onGoToVisitor}
                  className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-sm tracking-wide transition flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>Go to Visitor</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>

      {/* Decorative footer label */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-400 font-medium tracking-wider select-none uppercase">
        Visitor Page Access Available At Bottom of Card
      </div>

    </div>
  );
}
