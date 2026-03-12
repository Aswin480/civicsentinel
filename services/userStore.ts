import { User } from '../types';

interface UserCredentials {
    email: string;
    password: string;
    mobile: string;
}

class UserStoreClass {
    private users: UserCredentials[] = [];

    constructor() {
        // Pre-seed a demo citizen for testing
        this.users.push({ email: 'citizen@example.com', password: 'password', mobile: '9876543210' });
    }

    register(email: string, password: string, mobile: string): boolean {
        // Check if user already exists
        if (this.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return false;
        }
        this.users.push({ email, password, mobile });
        return true;
    }

    authenticate(email: string, password: string, role: 'ADMIN' | 'CITIZEN'): User | null {
        // 1. Permanent Admin Check
        if (role === 'ADMIN') {
            if (email === 'admin@civic.gov' && password === 'admin123') {
                return {
                    name: 'System Administrator',
                    role: 'ADMIN',
                    id: 'ADM-MASTER-01'
                };
            }
            return null;
        }

        // 2. Citizen Check
        const user = this.users.find(u =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        );

        if (user) {
            return {
                name: user.email.split('@')[0],
                role: 'CITIZEN',
                id: `CIT-${Math.floor(Math.random() * 10000)}`
            };
        }

        return null;
    }
}

export const UserStore = new UserStoreClass();
