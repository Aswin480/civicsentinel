import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GrievanceStore } from '../services/grievanceStore';
import { Download, TrendingUp, TrendingDown, Minus, Zap, Sparkles, MapPin } from 'lucide-react';

const Dashboard: React.FC = () => {
    const grievances = GrievanceStore.getAll();

    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        grievances.forEach(g => counts[g.category] = (counts[g.category] || 0) + 1);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [grievances]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        grievances.forEach(g => counts[g.status] = (counts[g.status] || 0) + 1);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [grievances]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="p-8 h-full overflow-y-auto bg-transparent text-slate-200 scrollbar-thin">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight italic">STRATEGIC <span className="text-indigo-500">INTEL</span></h2>
                    <p className="text-slate-400 mt-1 text-xs font-bold uppercase tracking-widest">Real-time performance metrics and grievance trends.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors text-xs font-bold backdrop-blur-md italic tracking-wider">
                    <Download size={14} /> EXPORT DATA
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors shadow-lg">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total Load</h3>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-mono font-bold text-white">{grievances.length}</div>
                        <div className="text-emerald-500 text-[10px] font-bold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <TrendingUp size={10} className="mr-1" /> 12%
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors shadow-lg">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Resolution Rate</h3>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-mono font-bold text-white">
                            {grievances.length > 0
                                ? Math.round((grievances.filter(g => g.status === 'Resolved').length / grievances.length) * 100)
                                : 0}%
                        </div>
                        <div className="text-amber-500 text-[10px] font-bold flex items-center bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Minus size={10} className="mr-1" /> Stable
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors shadow-lg">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Avg Processing Time</h3>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-mono font-bold text-white">4.2<span className="text-lg text-slate-500 ml-1">hrs</span></div>
                        <div className="text-emerald-500 text-[10px] font-bold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <TrendingDown size={10} className="mr-1" /> 8%
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Category Chart */}
                <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 h-96 shadow-lg">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-l-4 border-indigo-500 pl-4">Sector Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Resource Allocation Prediction */}
                <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 h-96 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={100} /></div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest border-l-4 border-amber-500 pl-4">Budget Forecast (AI)</h3>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-bold text-amber-500">
                            <Sparkles size={10} /> PROJECTED LOAD
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[
                            { dept: 'Public Works (PWD)', trend: 65, cost: 'High' },
                            { dept: 'Energy & Power', trend: 42, cost: 'Med' },
                            { dept: 'Municipal Health', trend: 28, cost: 'Low' },
                            { dept: 'Traffic & Transit', trend: 15, cost: 'Med' },
                        ].map(item => (
                            <div key={item.dept}>
                                <div className="flex justify-between items-end mb-2">
                                    <div className="text-[11px] font-bold text-slate-300">{item.dept}</div>
                                    <div className="text-[10px] font-mono text-slate-500">Load: {item.trend}%</div>
                                </div>
                                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${item.trend}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                        <div className="flex-1 bg-white/3 p-3 rounded-xl border border-white/5 text-center shadow-inner">
                            <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Est. Cost</div>
                            <div className="text-xl font-mono font-black text-emerald-500">₹4.2M</div>
                        </div>
                        <div className="flex-1 bg-white/3 p-3 rounded-xl border border-white/5 text-center shadow-inner">
                            <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Efficiency Gain</div>
                            <div className="text-xl font-mono font-black text-indigo-400">+22%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Chart */}
                <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 h-96 shadow-lg">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-l-4 border-emerald-500 pl-4">State Maturity</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Hotspot Summary */}
                <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 h-96 shadow-lg">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-l-4 border-red-500 pl-4">Hotspot Mapping</h3>
                    <div className="space-y-4">
                        {[
                            { zone: 'District 4 (Urban Core)', issues: 12, risk: 'High' },
                            { zone: 'Sector 12 (Residential)', issues: 8, risk: 'Medium' },
                            { zone: 'Industrial Bypass', issues: 5, risk: 'Low' },
                            { zone: 'Old Town Square', issues: 3, risk: 'Medium' },
                        ].map(zone => (
                            <div key={zone.zone} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors shadow-inner">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <MapPin size={16} className="text-indigo-400" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">{zone.zone}</div>
                                </div>
                                <div className={`text-[10px] font-black px-3 py-1 rounded-full ${zone.risk === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : zone.risk === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                    {zone.risk}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;