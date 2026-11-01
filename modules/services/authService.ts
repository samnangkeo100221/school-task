import { UserProfile, UserRole } from '../types';

const CURRENT_USER_KEY = 'msts_current_user';

export const DEFAULT_USERS: UserProfile[] = [
  {
    uid: 'USR-KS-01',
    email: 'samnang.keo@school.edu.kh',
    displayName: 'លោកគ្រូ កែវ សំណាង (គណិតវិទ្យា)',
    role: 'ADMIN',
    teacherId: 'T-001',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '012 889 456'
  },
  {
    uid: 'USR-DIR-01',
    email: 'principal@school.edu.kh',
    displayName: 'លោកនាយក ឈុន គឹមសាន',
    role: 'SCHOOL_DIRECTOR',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    phone: '012 998 877'
  },
  {
    uid: 'USR-TCH-02',
    email: 'sophea.sun@school.edu.kh',
    displayName: 'អ្នកគ្រូ ស៊ុន សុភា (ភាសាខ្មែរ)',
    role: 'TEACHER',
    teacherId: 'T-002',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    phone: '098 765 432'
  },
  {
    uid: 'USR-ATT-01',
    email: 'attendance@school.edu.kh',
    displayName: 'បុគ្គលិកកត់ត្រាវត្តមាន',
    role: 'ATTENDANCE_STAFF',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: '015 123 456'
  }
];

class AuthService {
  private currentUser: UserProfile;

  constructor() {
    this.currentUser = DEFAULT_USERS[0];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CURRENT_USER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.uid) {
            this.currentUser = parsed;
          } else {
            this.currentUser = DEFAULT_USERS[0];
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
          }
        } else {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
        }
      } catch {
        this.currentUser = DEFAULT_USERS[0];
      }
    }
  }

  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile): void {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } catch {
        // ignore
      }
    }
  }

  public switchRole(role: UserRole): UserProfile {
    const match = DEFAULT_USERS.find(u => u.role === role) || {
      ...this.currentUser,
      role
    };
    this.setCurrentUser(match);
    return match;
  }

  public canAccess(requiredRole: UserRole): boolean {
    if (this.currentUser.role === 'ADMIN') return true;
    if (requiredRole === this.currentUser.role) return true;
    if (requiredRole === 'TEACHER' && this.currentUser.role === 'SCHOOL_DIRECTOR') return true;
    return false;
  }
}

export const authService = new AuthService();
