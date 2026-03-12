import { Grievance, LocationData } from '../types';
import { API_URL, isCloudEnabled } from './apiClient';

const CATEGORIES = ['Infrastructure', 'Water', 'Electricity', 'Sanitation', 'Police', 'Health'] as const;
const STATUSES = ['Open', 'In Progress', 'Resolved'] as const;
const STORAGE_KEY = 'CIVIC_SENTINEL_DATA_V2';

// Convert Base64 DataURL to Blob for upload
const base64ToBlob = (base64: string): Blob => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

type Listener = () => void;

class GrievanceStoreClass {
    private data: Grievance[] = [];
    private listeners: Listener[] = [];
    private initialized = false;

    constructor() {
        this.init();

        // LISTEN FOR CROSS-TAB UPDATES
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (event) => {
                if (event.key === STORAGE_KEY && event.newValue) {
                    try {
                        const syncedData = JSON.parse(event.newValue);
                        this.data = syncedData;
                        this.notifyListenersOnly();
                    } catch (e) {
                        console.error("Sync error", e);
                    }
                }
            });
        }
    }

    private async init() {
        let loadedFromApi = false;

        if (isCloudEnabled()) {
            try {
                const response = await fetch(`${API_URL}/grievances`);
                if (response.ok) {
                    const data = await response.json();
                    this.data = data;
                    loadedFromApi = true;
                    this.notify();
                }

                // For real-time updates we would use Socket.io or SSE here.
                // For now, we rely on standard fetch polling or push updates 
                // triggered when the user does an action.
            } catch (err) {
                console.warn("API connection failed:", err);
            }
        }

        if (!loadedFromApi) {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                try {
                    this.data = JSON.parse(savedData);
                } catch (e) {
                    this.data = [];
                }
            } else {
                this.data = [];
            }
            this.notifyListenersOnly();
        }

        this.initialized = true;
    }

    private saveLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error("Storage Limit Reached");
        }
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(listener => listener());
        this.saveLocal();
    }

    private notifyListenersOnly() {
        this.listeners.forEach(listener => listener());
    }

    getAll(): Grievance[] {
        return [...this.data];
    }

    getByUser(userName: string): Grievance[] {
        return this.data.filter(g => g.userName === userName);
    }

    getById(id: string): Grievance | undefined {
        return this.data.find(g => g.id === id);
    }

    async addGrievance(grievance: Omit<Grievance, 'id' | 'status' | 'replies' | 'timestamp' | 'votes'>): Promise<Grievance> {
        const tempId = `GRV-${Date.now()}`;
        let evidenceUrl = grievance.evidenceUrl || '';

        if (isCloudEnabled() && evidenceUrl.startsWith('data:')) {
            try {
                const blob = base64ToBlob(evidenceUrl);
                const formData = new FormData();
                formData.append('evidence', blob, `${tempId}.jpg`);

                const uploadRes = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    evidenceUrl = uploadData.publicUrl;
                }
            } catch (err) {
                console.error("Upload failed", err);
            }
        }

        const newGrievance: Grievance = {
            ...grievance,
            id: tempId,
            status: 'Open',
            replies: [],
            votes: 0,
            timestamp: Date.now(),
            evidenceUrl
        };

        if (isCloudEnabled()) {
            this.data.unshift(newGrievance);
            this.notify();

            try {
                await fetch(`${API_URL}/grievances`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newGrievance)
                });
            } catch (err) {
                console.error("Add grievance failed", err);
            }
        } else {
            this.data.unshift(newGrievance);
            this.notify();
        }

        return newGrievance;
    }

    async toggleVote(id: string) {
        const grievance = this.data.find(g => g.id === id);
        if (!grievance) return;

        grievance.votes += 1;
        this.notify();

        if (isCloudEnabled()) {
            try {
                await fetch(`${API_URL}/grievances/${id}/vote`, {
                    method: 'PUT'
                });
            } catch (err) {
                console.error("Failed to vote", err);
            }
        }
    }

    async addReply(id: string, message: string, sender: 'User' | 'Admin' | 'AI_Assistant') {
        const grievance = this.data.find(g => g.id === id);
        if (!grievance) return;

        const newReply = {
            id: `rep-${Date.now()}`,
            sender,
            message,
            timestamp: Date.now()
        };

        if (isCloudEnabled()) {
            // Optimistic Update
            const updatedReplies = [...grievance.replies, newReply];
            grievance.replies = updatedReplies;
            this.notify();

            try {
                await fetch(`${API_URL}/grievances/${id}/reply`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newReply })
                });
            } catch (err) {
                console.error("Failed to add reply", err);
            }
        } else {
            grievance.replies.push(newReply);
            this.notify();
        }
    }

    async updateStatus(id: string, status: Grievance['status']) {
        const grievance = this.data.find(g => g.id === id);
        if (grievance) {
            grievance.status = status;
            this.notify();
        }

        if (isCloudEnabled()) {
            try {
                await fetch(`${API_URL}/grievances/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
            } catch (err) {
                console.error("Failed to update status", err);
            }
        }
    }
}

export const GrievanceStore = new GrievanceStoreClass();