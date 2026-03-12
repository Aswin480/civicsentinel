import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Grievance } from '../types';
import { GrievanceStore } from '../services/grievanceStore';
import { GeminiService } from '../services/geminiService';
import { Plus, Send, AlertCircle, CheckCircle2, Clock, Sparkles, LogOut, Loader2, Camera, MapPin, RefreshCw, XCircle, ScanLine, Image as ImageIcon, X, SwitchCamera, ChevronRight, History, Radio, Shield, Layers, UserCircle } from 'lucide-react';

interface CitizenPortalProps {
    user: User;
    onLogout: () => void;
}

const compressImage = (base64Str: string, maxWidth = 1000, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(base64Str); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64Str);
    });
};

const CitizenPortal: React.FC<CitizenPortalProps> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'LIST' | 'FEED' | 'NEW'>('LIST');
    const [allGrievances, setAllGrievances] = useState<Grievance[]>([]);
    const [myGrievances, setMyGrievances] = useState<Grievance[]>([]);

    const [viewState, setViewState] = useState<'FORM' | 'SUCCESS'>('FORM');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState<string>('Other');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
    const [locationStatus, setLocationStatus] = useState<'Idle' | 'Locating' | 'Locked' | 'Error'>('Idle');
    const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const watchId = useRef<number | null>(null);

    useEffect(() => {
        const updateData = () => {
            const all = GrievanceStore.getAll();
            setAllGrievances(all);
            setMyGrievances(all.filter(g => g.userName === user.name));
        };
        updateData();
        const unsubscribe = GrievanceStore.subscribe(updateData);
        return () => unsubscribe();
    }, [user.name]);

    useEffect(() => {
        if (highlightId) {
            const timer = setTimeout(() => setHighlightId(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [highlightId]);

    const stopLocationWatch = useCallback(() => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    }, []);

    const startLocationWatch = useCallback(() => {
        if (!("geolocation" in navigator)) { setLocationStatus('Error'); return; }
        stopLocationWatch();
        setLocationStatus('Locating');
        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setLat(latitude);
                setLng(longitude);
                setLocationAccuracy(accuracy);
                if (accuracy < 20) setLocationStatus('Locked');
                else setLocationStatus('Locating');
            },
            (error) => {
                console.error("Geo error:", error);
                if (error.code === error.PERMISSION_DENIED) setLocationStatus('Error');
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
    }, [stopLocationWatch]);

    useEffect(() => {
        if (activeTab === 'NEW') startLocationWatch();
        else { stopLocationWatch(); stopCamera(); }
        return () => { stopLocationWatch(); stopCamera(); };
    }, [activeTab, startLocationWatch, stopLocationWatch]);

    const processEvidence = async (base64Data: string) => {
        setEvidencePreview(base64Data);
        const compressed = await compressImage(base64Data);
        setEvidencePreview(compressed);
        if (locationStatus !== 'Locked') startLocationWatch();
        setIsAnalyzingImage(true);
        const analysis = await GeminiService.analyzeImageEvidence(compressed);
        if (analysis.description) setDesc(analysis.description);
        if (analysis.category && analysis.category !== "Other") setCategory(analysis.category);
        setIsAnalyzingImage(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                if (typeof reader.result === 'string') processEvidence(reader.result);
            };
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            setShowCamera(true);
            setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
        } catch (err) {
            alert("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                stopCamera();
                processEvidence(dataUrl);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const finalLat = lat || 20.5937;
        const finalLng = lng || 78.9629;

        const newGrievance = await GrievanceStore.addGrievance({
            userName: user.name,
            type: 'NORMAL',
            category: category as any,
            description: desc,
            location: {
                state: 'Unknown', district: 'Unknown', taluk: 'Unknown', panchayat: 'Unknown', ward: 'Unknown',
                lat: finalLat, lng: finalLng
            },
            evidenceUrl: evidencePreview || `https://picsum.photos/400/300?random=${Math.random()}`
        });

        stopLocationWatch();
        setIsSubmitting(false);
        if (navigator.vibrate) navigator.vibrate(200);
        setViewState('SUCCESS');
        setTimeout(() => {
            setHighlightId(newGrievance.id);
            resetForm();
            setActiveTab('LIST');
            setViewState('FORM');
        }, 2000);
    };

    const resetForm = () => {
        setDesc(''); setCategory('Other'); setEvidencePreview(null);
        setLat(null); setLng(null); setLocationAccuracy(null); setLocationStatus('Idle');
    };

    if (viewState === 'SUCCESS') {
        return (
            <div className="h-screen w-full bg-emerald-600 flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[500px] h-[500px] border-2 border-white/20 rounded-full animate-ping opacity-20"></div>
                </div>
                <div className="z-10 flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="bg-white text-emerald-600 p-6 rounded-full mb-6 shadow-2xl shadow-emerald-900/50">
                        <CheckCircle2 size={64} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">Report Filed</h2>
                    <p className="text-emerald-100 mb-8 font-medium">Ticket generated successfully.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col text-slate-800 font-sans">
            {/* Camera Overlay */}
            {showCamera && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
                    <div className="relative flex-1 bg-black">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <button onClick={stopCamera} className="absolute top-6 right-6 p-3 bg-black/40 text-white rounded-full backdrop-blur-md">
                            <X size={24} />
                        </button>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/30 rounded-2xl flex items-center justify-center">
                            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                        </div>
                    </div>
                    <div className="h-40 bg-black flex items-center justify-center gap-16 pb-10 pt-6">
                        <button className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative active:scale-95 transition-transform" onClick={capturePhoto}>
                            <div className="w-16 h-16 bg-white rounded-full"></div>
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm/50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-900 leading-tight">Citizen Portal</h1>
                        <p className="text-xs text-slate-500 font-medium">Hello, {user.name}</p>
                    </div>
                </div>
                <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-2 rounded-lg">
                    <LogOut size={18} />
                </button>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-6xl w-full mx-auto p-4 md:p-8 gap-8">

                {/* Navigation Sidebar */}
                <div className="w-full md:w-72 flex flex-col gap-3 shrink-0">
                    <button
                        onClick={() => setActiveTab('LIST')}
                        className={`p-4 rounded-2xl text-left font-bold flex items-center gap-3 transition-all duration-300 ${activeTab === 'LIST' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-2 ring-indigo-100' : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm border border-slate-100'}`}
                    >
                        <History size={20} /> My Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('FEED')}
                        className={`p-4 rounded-2xl text-left font-bold flex items-center gap-3 transition-all duration-300 ${activeTab === 'FEED' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-2 ring-indigo-100' : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm border border-slate-100'}`}
                    >
                        <Radio size={20} className={activeTab === 'FEED' ? 'animate-pulse' : ''} /> Town Hall
                    </button>
                    <button
                        onClick={() => setActiveTab('NEW')}
                        className={`p-4 rounded-2xl text-left font-bold flex items-center gap-3 transition-all duration-300 ${activeTab === 'NEW' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 ring-2 ring-emerald-100' : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm border border-slate-100'}`}
                    >
                        <Plus size={20} /> New Report
                    </button>

                    <div className="mt-auto hidden md:block bg-indigo-50 p-6 rounded-3xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-indigo-100"><Sparkles size={100} /></div>
                        <h4 className="font-bold text-indigo-900 relative z-10">AI Assisted</h4>
                        <p className="text-xs text-indigo-700 mt-2 relative z-10 leading-relaxed">
                            Our AI analyzes photos to automatically detect damage type and severity, speeding up resolution times by 40%.
                        </p>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="flex-1 bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative flex flex-col">

                    {activeTab === 'LIST' && (
                        <div className="h-full overflow-y-auto p-6 md:p-8 scrollbar-thin">
                            <h2 className="text-2xl font-bold mb-6 text-slate-900">Your Reports</h2>
                            {myGrievances.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                    <div className="bg-slate-50 p-4 rounded-full mb-4"><CheckCircle2 size={32} className="opacity-20" /></div>
                                    <p>Track your reported issues here.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {myGrievances.map(g => (
                                        <div key={g.id} className={`group border rounded-3xl p-6 transition-all duration-300 hover:shadow-lg ${g.id === highlightId ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${g.status === 'Open' ? 'bg-red-500 text-white' :
                                                        g.status === 'In Progress' ? 'bg-amber-500 text-white' :
                                                            g.status === 'ANALYZING' ? 'bg-indigo-600 text-white animate-pulse flex items-center gap-1' :
                                                                'bg-emerald-500 text-white'
                                                        }`}>
                                                        {g.status === 'ANALYZING' && <Loader2 size={10} className="animate-spin" />}
                                                        {g.status}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono font-bold">ID: {g.id}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(g.timestamp).toLocaleDateString()}</span>
                                            </div>

                                            <div className="flex gap-6">
                                                <div className="flex-1">
                                                    <h3 className="font-black text-slate-900 text-xl mb-2">{g.category}</h3>
                                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{g.description}</p>

                                                    {/* Elite Transparency: Show AI Analysis for the Citizen */}
                                                    {g.aiAnalysis && (
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            <div className="bg-indigo-50 px-2 py-1 rounded border border-indigo-100 text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                                                                <Shield size={10} /> {g.aiAnalysis.suggestedDepartment || 'Govt Dept'}
                                                            </div>
                                                            <div className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                                                <Layers size={10} /> {g.aiAnalysis.impactRadius} Impact
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {g.evidenceUrl && (
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-white">
                                                        <img src={g.evidenceUrl} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </div>

                                            {g.replies.length > 0 && (
                                                <div className="mt-4 bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle2 size={14} className="text-indigo-200" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100">Official Update</span>
                                                    </div>
                                                    <p className="text-xs font-medium leading-relaxed">"{g.replies[g.replies.length - 1].message}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'FEED' && (
                        <div className="h-full overflow-y-auto p-6 md:p-8 scrollbar-thin">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">Town Hall</h2>
                                    <p className="text-xs text-slate-500 font-medium">Community reports near your location.</p>
                                </div>
                                <div className="bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Live Feed</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {allGrievances.filter(g => g.userName !== user.name).map(g => (
                                    <div key={g.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <UserCircle size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">{g.userName}</div>
                                                <div className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Reported {new Date(g.timestamp).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 shadow-inner bg-slate-100">
                                            <img src={g.evidenceUrl} className="w-full h-full object-cover" />
                                        </div>

                                        <h3 className="font-bold text-slate-900 mb-2">{g.category}</h3>
                                        <p className="text-sm text-slate-500 mb-6 line-clamp-3">"{g.description}"</p>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <button
                                                onClick={() => GrievanceStore.toggleVote(g.id)}
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
                                            >
                                                <Plus size={14} /> VOTES ({g.votes || 0})
                                            </button>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <MapPin size={12} />
                                                <span className="text-[10px] font-bold uppercase font-mono">Nearby Site</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'NEW' && (
                        <div className="h-full overflow-y-auto p-6 md:p-10 scrollbar-thin">
                            <div className="max-w-2xl mx-auto">
                                <h2 className="text-2xl font-bold mb-2 text-slate-900">New Grievance</h2>
                                <p className="text-slate-500 text-sm mb-8">Upload evidence to auto-fill details.</p>

                                <form onSubmit={handleSubmit} className="space-y-8">

                                    {/* Location Status */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${locationStatus === 'Locked' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">GPS Location</div>
                                                <div className="text-[10px] text-slate-500 font-mono">
                                                    {lat ? `${lat.toFixed(6)}, ${lng?.toFixed(6)}` : 'Triangulating position...'}
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" onClick={startLocationWatch} className="text-slate-400 hover:text-indigo-600 p-2">
                                            <RefreshCw size={16} className={locationStatus === 'Locating' ? 'animate-spin' : ''} />
                                        </button>
                                    </div>

                                    {/* Evidence */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700">Evidence Photo</label>
                                        {!evidencePreview ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <button type="button" onClick={startCamera} className="aspect-square rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                                                    <Camera size={28} className="text-emerald-400" />
                                                    <span className="font-bold text-xs">Camera</span>
                                                </button>
                                                <div className="relative aspect-square rounded-2xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                                                    <ImageIcon size={28} className="text-slate-400" />
                                                    <span className="font-bold text-xs text-slate-500">Upload</span>
                                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-video bg-black group">
                                                <img src={evidencePreview} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setEvidencePreview(null)} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full backdrop-blur hover:bg-red-600 transition-colors">
                                                    <X size={16} />
                                                </button>
                                                {isAnalyzingImage && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                                        <ScanLine size={32} className="animate-pulse text-indigo-400 mb-2" />
                                                        <span className="font-bold text-sm">Analyzing...</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Category</label>
                                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all">
                                                <option value="Other">Select Category...</option>
                                                <option value="Infrastructure">Infrastructure</option>
                                                <option value="Water">Water Supply</option>
                                                <option value="Electricity">Electricity</option>
                                                <option value="Sanitation">Sanitation</option>
                                                <option value="Police">Police</option>
                                                <option value="Health">Health</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Description</label>
                                            <textarea
                                                value={desc}
                                                onChange={(e) => setDesc(e.target.value)}
                                                className="w-full p-4 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none placeholder:text-slate-400"
                                                placeholder="Describe the issue..."
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!desc || !category || !evidencePreview || isAnalyzingImage || isSubmitting}
                                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-indigo-600 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <>Submit Report <ChevronRight size={18} /></>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CitizenPortal;