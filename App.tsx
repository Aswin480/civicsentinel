import React, { useState } from 'react';
import WarRoom from './components/WarRoom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CitizenPortal from './components/CitizenPortal';
import { Map, BarChart3, Shield, LogOut, Radio, UserCircle } from 'lucide-react';
import { User } from './types';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<'MAP' | 'ANALYTICS'>('MAP');

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
        setUser(null);
        setCurrentView('MAP');
    };

    // If not logged in, show Login Screen
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    // If User is Citizen, show Citizen Portal
    if (user.role === 'CITIZEN') {
        return <CitizenPortal user={user} onLogout={handleLogout} />;
    }

    // If User is Admin, show War Room / Dashboard
    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden text-slate-200 font-sans">
            {/* Top Navigation HUD */}
            <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-50 relative">
                {/* Logo Area */}
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
                        <Shield className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-widest text-white leading-none">CIVIC<span className="text-emerald-500">SENTINEL</span></h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">Command Center Live</span>
                        </div>
                    </div>
                </div>

                {/* Center Tabs */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/50 p-1 rounded-xl border border-white/5 flex gap-1 shadow-inner">
                    <button 
                        onClick={() => setCurrentView('MAP')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 ${
                            currentView === 'MAP' 
                            ? 'bg-slate-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        <Map size={14} /> TACTICAL
                    </button>
                    <button 
                         onClick={() => setCurrentView('ANALYTICS')}
                         className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 ${
                            currentView === 'ANALYTICS' 
                            ? 'bg-slate-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        <BarChart3 size={14} /> INTELLIGENCE
                    </button>
                </div>

                {/* Right Profile Area */}
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-bold text-slate-200">{user.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">ID: {user.id}</div>
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                     <button onClick={handleLogout} className="group flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-xs font-medium uppercase tracking-wider">
                        <span className="hidden md:inline group-hover:underline decoration-red-500/50 underline-offset-4">Logout</span>
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                {currentView === 'MAP' ? <WarRoom /> : <Dashboard />}
            </main>
        </div>
    );
};

export default App;