import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AlertCircle, X, Send, MapPin, Layers, ChevronRight, ChevronDown, Clock, Download, Zap, HardHat, Filter, Droplets, Briefcase, Flame, Activity, Sparkles, Bot, Search, Siren, CheckCircle2, MessageSquare, UserCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { GrievanceStore } from '../services/grievanceStore';
import { GeminiService } from '../services/geminiService';
import { Grievance } from '../types';

// --- Sub-components & Utilities ---

const MapController: React.FC<{ selectedGrievance: Grievance | null }> = ({ selectedGrievance }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedGrievance) {
            map.flyTo([selectedGrievance.location.lat, selectedGrievance.location.lng], 16, {
                animate: true,
                duration: 1.5
            });
        }
    }, [selectedGrievance, map]);
    return null;
};

const createTacticalIcon = (type: string, status: string) => {
    let className = 'marker-normal';
    if (type === 'CRITICAL') className = 'marker-critical';
    if (status === 'Resolved') className = 'marker-resolved';
    if (status === 'ANALYZING') className = 'marker-analyzing';

    return L.divIcon({
        className: '',
        html: `<div class="tactical-marker ${className}">
                 <div class="ping"></div>
                 <div class="core"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};

const WarRoom: React.FC = () => {
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setGrievances(GrievanceStore.getAll());
        const unsubscribe = GrievanceStore.subscribe(() => {
            setGrievances(GrievanceStore.getAll());
        });
        return () => unsubscribe();
    }, []);

    const selectedGrievance = useMemo(() =>
        grievances.find(g => g.id === selectedId) || null
        , [grievances, selectedId]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedGrievance?.replies]);

    const handleSendReply = () => {
        if (selectedId && replyText) {
            GrievanceStore.addReply(selectedId, replyText, 'Admin');
            setReplyText('');
        }
    };

    const handleGenerateAIResponse = async () => {
        if (!selectedGrievance) return;
        setIsGeneratingAI(true);
        const draft = await GeminiService.draftResponse(selectedGrievance);
        setReplyText(draft);
        setIsGeneratingAI(false);
    };

    const handleStatusUpdate = (newStatus: Grievance['status']) => {
        if (selectedId) {
            GrievanceStore.updateStatus(selectedId, newStatus);
        }
    };

    return (
        <div className="flex h-full w-full bg-slate-950 text-slate-200 relative">

            {/* MAP LAYER */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: '100%', width: '100%', background: '#020617' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <MapController selectedGrievance={selectedGrievance} />

                    <MarkerClusterGroup chunkedLoading>
                        {grievances.map(g => (
                            <Marker
                                key={g.id}
                                position={[g.location.lat, g.location.lng]}
                                icon={createTacticalIcon(g.type, g.status)}
                                eventHandlers={{
                                    click: () => setSelectedId(g.id)
                                }}
                            />
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>

            {/* FLOATING INTEL WIDGET (Top Left) */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
                <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 min-w-[280px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} className="animate-pulse" /> Live Signal
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500">{new Date().toLocaleTimeString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-2xl font-mono font-bold text-white">{grievances.length}</div>
                            <div className="text-[10px] text-slate-400 font-medium">Active Tickets</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-mono font-bold text-red-500">{grievances.filter(g => g.type === 'CRITICAL').length}</div>
                            <div className="text-[10px] text-slate-400 font-medium">Critical Alerts</div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[8px] text-slate-300">
                                    <UserCircle size={14} />
                                </div>
                            ))}
                        </div>
                        <span className="text-slate-500">3 Agents Online</span>
                    </div>
                </div>
            </div>


            {/* RIGHT SIDEBAR: COMMAND CONSOLE */}
            <div className={`absolute top-4 bottom-4 right-4 w-[420px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 transform z-20 overflow-hidden ${selectedGrievance ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'}`}>
                {selectedGrievance && (
                    <>
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-800">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col">
                                    <span className="font-mono text-[10px] text-slate-400 mb-1">TICKET ID: {selectedGrievance.id}</span>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-white">{selectedGrievance.category}</h2>
                                        {selectedGrievance.type === 'CRITICAL' && (
                                            <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded uppercase animate-pulse">
                                                Critical
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedId(null)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/20 p-2 rounded-lg border border-white/5">
                                <MapPin size={12} className="text-indigo-400" />
                                <span className="font-mono truncate">{selectedGrievance.location.district}, {selectedGrievance.location.state} • {selectedGrievance.location.lat.toFixed(4)}, {selectedGrievance.location.lng.toFixed(4)}</span>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">

                            {/* Evidence Card */}
                            <div className="group relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video shadow-lg">
                                <img src={selectedGrievance.evidenceUrl} alt="Evidence" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                                    <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed">"{selectedGrievance.description}"</p>
                                </div>
                            </div>

                            {/* Status Workflow */}
                            <div className="bg-slate-800/50 rounded-xl p-1 flex gap-1 border border-white/5">
                                {['Open', 'In Progress', 'Resolved'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(status as any)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 ${selectedGrievance.status === status
                                            ? (status === 'Open' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : status === 'In Progress' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50')
                                            : 'text-slate-500 hover:bg-white/5'
                                            }`}
                                    >
                                        {status === 'Resolved' && <CheckCircle2 size={12} />}
                                        {status === 'In Progress' && <Activity size={12} />}
                                        {status === 'Open' && <Siren size={12} />}
                                        {status}
                                    </button>
                                ))}
                            </div>

                            {/* AI Strategic Intel Block */}
                            {selectedGrievance.aiAnalysis && (
                                <div className="bg-slate-950/80 border border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden shadow-inner">
                                    <div className="absolute top-0 right-0 p-4 opacity-5"><Bot size={80} /></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                                                <Sparkles size={14} className="text-indigo-400" />
                                            </div>
                                            <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Strategic Assessment</h4>
                                        </div>
                                        <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-bold text-indigo-400">
                                            AI-VERIFIED
                                        </div>
                                    </div>

                                    {/* Urgency Gauge */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Priority Score</span>
                                            <span className="text-lg font-mono font-bold text-indigo-400">{selectedGrievance.aiAnalysis.priorityScore}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full transition-all duration-1000 ${selectedGrievance.aiAnalysis.priorityScore > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-indigo-500'}`}
                                                style={{ width: `${selectedGrievance.aiAnalysis.priorityScore}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">Impact Scale</span>
                                            <div className="flex items-center gap-1.5">
                                                <Layers size={12} className="text-indigo-400" />
                                                <span className="font-bold text-slate-200 text-xs">{selectedGrievance.aiAnalysis.impactRadius}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">Est. Budget</span>
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={12} className="text-amber-400" />
                                                <span className="font-bold text-slate-200 text-xs">{selectedGrievance.aiAnalysis.estimatedCost || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 mb-4">
                                        <span className="text-indigo-400/60 block text-[9px] uppercase font-bold mb-1">Target Department</span>
                                        <div className="flex items-center gap-2">
                                            <Shield size={12} className="text-indigo-400" />
                                            <span className="font-bold text-indigo-200 text-sm italic">{selectedGrievance.aiAnalysis.suggestedDepartment}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-indigo-500/30 pl-3">
                                        {selectedGrievance.aiAnalysis.summary}
                                    </p>
                                </div>
                            )}

                            {/* Chat Thread */}
                            <div className="flex flex-col gap-3 pt-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <MessageSquare size={10} /> Secure Comm Channel
                                </label>

                                <div className="space-y-4 min-h-[100px]">
                                    {selectedGrievance.replies.length === 0 ? (
                                        <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                                            <p className="text-xs text-slate-500">No communications yet.</p>
                                        </div>
                                    ) : (
                                        selectedGrievance.replies.map(reply => (
                                            <div key={reply.id} className={`flex ${reply.sender === 'User' ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-[85%] relative group ${reply.sender === 'User' ? '' : 'text-right'}`}>
                                                    <div className={`text-[10px] font-bold mb-1 ${reply.sender === 'User' ? 'text-slate-500 ml-1' : 'text-emerald-500 mr-1'}`}>
                                                        {reply.sender === 'User' ? 'CITIZEN' : 'COMMAND CENTER'}
                                                    </div>
                                                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-md ${reply.sender === 'User'
                                                        ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                                        : 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-900/20'
                                                        }`}>
                                                        {reply.message}
                                                    </div>
                                                    <span className="text-[9px] text-slate-600 font-mono mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {new Date(reply.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </div>
                        </div>

                        {/* Reply Input Area */}
                        <div className="p-4 border-t border-white/5 bg-slate-900">
                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type official response..."
                                    className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none resize-none h-16 p-2"
                                />
                                <div className="flex justify-between items-center mt-2 px-1">
                                    <button
                                        onClick={handleGenerateAIResponse}
                                        disabled={isGeneratingAI}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-950/30 transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingAI ? <Activity size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        AI DRAFT
                                    </button>
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyText}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Empty State Prompt */}
            {!selectedGrievance && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-slate-400 px-6 py-3 rounded-full border border-white/10 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono">SYSTEM READY. SELECT A MARKER TO INITIALIZE INTEL.</span>
                </div>
            )}
        </div>
    );
};

export default WarRoom;