import React, { useState } from 'react';
import { Shield, User, Lock, ArrowRight, Building2, UserPlus, LogIn, Phone } from 'lucide-react';
import { User as UserType } from '../types';
import { UserStore } from '../services/userStore';
import { isCloudEnabled } from '../services/apiClient';

interface LoginProps {
    onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [role, setRole] = useState<'CITIZEN' | 'ADMIN'>('CITIZEN');
    const [isRegistering, setIsRegistering] = useState(false);

    const [email, setEmail] = useState(''); // Changed from username to email
    const [password, setPassword] = useState('');
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Fallback for demo if keys are literally not provided in .env
        await new Promise(r => setTimeout(r, 800));
        const user = UserStore.authenticate(email, password, role);
        if (user) onLogin(user);
        else { setError('Configuration Error: Real backend keys missing or Invalid Credentials'); setIsLoading(false); }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            {/* Dynamic Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-4xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden z-10 mx-6 ring-1 ring-white/5">

                {/* Branding Side */}
                <div className="md:w-1/2 p-10 md:p-14 bg-gradient-to-br from-slate-900/80 to-slate-950/80 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                    <div>
                        <div className="flex items-center gap-3 text-emerald-400 mb-8">
                            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                <Shield size={28} />
                            </div>
                            <span className="text-xl font-bold tracking-widest text-white">CIVIC<span className="text-emerald-500">SENTINEL</span></span>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Civic intelligence,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">reimagined.</span></h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                            Advanced geospatial tracking and AI-powered grievance resolution system for next-gen governance.
                        </p>
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                            <h4 className="text-emerald-400 font-bold text-2xl mb-1">Real-time</h4>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Surveillance Grid</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                            <h4 className="text-indigo-400 font-bold text-2xl mb-1">AI Core</h4>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Auto-Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Login Form Side */}
                <div className="md:w-1/2 p-10 md:p-14 flex flex-col justify-center relative bg-slate-900/20">

                    <div className="flex bg-slate-950/50 p-1.5 rounded-xl border border-white/10 mb-8 w-fit self-center">
                        <button
                            onClick={() => { setRole('CITIZEN'); setIsRegistering(false); setError(''); }}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${role === 'CITIZEN' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            CITIZEN
                        </button>
                        <button
                            onClick={() => { setRole('ADMIN'); setIsRegistering(false); setError(''); }}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${role === 'ADMIN' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-500 hover:text-white'}`}
                        >
                            OFFICIAL
                        </button>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
                        {role === 'ADMIN' ? 'Command Access' : (isRegistering ? 'Create Profile' : 'Welcome Back')}
                    </h3>
                    <p className="text-center text-slate-500 text-xs mb-8">Enter credentials to access the secure network.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                                    {role === 'ADMIN' ? <Building2 size={18} /> : <User size={18} />}
                                </div>
                                <input
                                    type="email"
                                    placeholder={role === 'ADMIN' ? "Official Email" : "Email Address"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                                />
                            </div>

                            {role === 'CITIZEN' && isRegistering && (
                                <div className="relative group animate-in slide-in-from-top-2 fade-in">
                                    <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors"><Phone size={18} /></div>
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                                    />
                                </div>
                            )}

                            <div className="relative group">
                                <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors"><Lock size={18} /></div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-xs text-center bg-red-950/30 py-2.5 rounded-lg border border-red-500/20 font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4 transform active:scale-[0.98] disabled:opacity-70 disabled:scale-100 ${role === 'ADMIN'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                }`}
                        >
                            {isLoading ? (
                                <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
                            ) : (
                                <>
                                    {isRegistering ? 'REGISTER' : 'INITIATE SESSION'} <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {role === 'CITIZEN' && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="text-slate-400 hover:text-white text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors group"
                            >
                                {isRegistering ? "Already have an account?" : "Don't have an account?"}
                                <span className="text-emerald-500 font-bold group-hover:underline decoration-emerald-500/50 underline-offset-4">{isRegistering ? "Login" : "Register"}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute bottom-6 text-[10px] text-slate-600 font-mono">
                SECURE CONNECTION • V4.2.0 • GOV.NET
            </div>
        </div>
    );
};

export default Login;