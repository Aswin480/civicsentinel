export type HierarchyLevel = 'Nation' | 'State' | 'District' | 'Taluk' | 'Panchayat' | 'Ward';

export interface LocationData {
    state: string;
    district: string;
    taluk: string;
    panchayat: string;
    ward: string;
    lat: number;
    lng: number;
}

export interface Reply {
    id: string;
    sender: 'User' | 'Admin' | 'AI_Assistant';
    message: string;
    timestamp: number;
}

export interface Grievance {
    id: string;
    userName: string;
    type: 'CRITICAL' | 'NORMAL';
    category: 'Infrastructure' | 'Water' | 'Electricity' | 'Sanitation' | 'Police' | 'Health' | 'Other';
    status: 'Open' | 'In Progress' | 'Resolved' | 'ANALYZING' | 'ANALYZED';
    description: string;
    location: LocationData;
    timestamp: number;
    evidenceUrl?: string;
    assignedTo?: string; // Specific Officer
    department?: string; // e.g., "Public Works Dept", "Health Ministry"
    votes: number;     // Crowdsourced importance
    replies: Reply[];
    aiAnalysis?: {
        sentiment: string;
        suggestedPriority: string;
        priorityScore: number; // 0-100
        impactRadius: string; // e.g., "Building", "Street", "Neighborhood", "City"
        summary: string;
        estimatedCost?: string;
        suggestedDepartment: string;
    };
}

export interface HierarchyNode {
    name: string;
    level: HierarchyLevel;
    count: number;
    children: Record<string, HierarchyNode>;
    lat?: number;
    lng?: number;
}

export interface User {
    name: string;
    role: 'ADMIN' | 'CITIZEN';
    id: string;
}
