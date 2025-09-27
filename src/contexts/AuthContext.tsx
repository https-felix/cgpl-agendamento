import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RegisteredUser } from '@/types';

interface AuthContextType {
  user: User | null;
  registeredUsers: RegisteredUser[];
  login: (firstName: string, whatsappLast4?: string, plannerPassword?: string) => Promise<boolean>;
  register: (userData: Omit<RegisteredUser, 'id' | 'registeredAt'>) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('cgpl-auth-user');
    const storedRegisteredUsers = localStorage.getItem('cgpl-registered-users');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    if (storedRegisteredUsers) {
      const users = JSON.parse(storedRegisteredUsers);
      setRegisteredUsers(users.map((u: any) => ({
        ...u,
        registeredAt: new Date(u.registeredAt)
      })));
    } else {
      // Initialize with some demo users for testing
      const demoUsers: RegisteredUser[] = [
        {
          id: '1',
          firstName: 'João',
          lastName: 'Silva',
          whatsapp: '11987654321',
          whatsappLast4: '4321',
          email: 'joao@email.com',
          registeredAt: new Date('2024-01-15')
        },
        {
          id: '2',
          firstName: 'Maria',
          lastName: 'Santos',
          whatsapp: '11976543210',
          whatsappLast4: '3210',
          email: 'maria@email.com',
          registeredAt: new Date('2024-02-10')
        }
      ];
      setRegisteredUsers(demoUsers);
      localStorage.setItem('cgpl-registered-users', JSON.stringify(demoUsers));
    }
    
    setIsLoading(false);
  }, []);

  // Save registered users to localStorage
  useEffect(() => {
    if (registeredUsers.length > 0) {
      localStorage.setItem('cgpl-registered-users', JSON.stringify(registeredUsers));
    }
  }, [registeredUsers]);

  const login = async (firstName: string, whatsappLast4?: string, plannerPassword?: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check for planner login
      if (plannerPassword === '123456') {
        const plannerUser: User = {
          id: 'planner',
          firstName: 'Planejador',
          fullName: 'Planejador CGPL',
          role: 'planner'
        };
        setUser(plannerUser);
        localStorage.setItem('cgpl-auth-user', JSON.stringify(plannerUser));
        return true;
      }

      // Check for client login
      if (whatsappLast4) {
        const registeredUser = registeredUsers.find(
          u => u.firstName.toLowerCase() === firstName.toLowerCase() && 
               u.whatsappLast4 === whatsappLast4
        );

        if (registeredUser) {
          const clientUser: User = {
            id: registeredUser.id,
            firstName: registeredUser.firstName,
            fullName: `${registeredUser.firstName} ${registeredUser.lastName}`,
            role: 'client',
            whatsappLast4: registeredUser.whatsappLast4
          };
          setUser(clientUser);
          localStorage.setItem('cgpl-auth-user', JSON.stringify(clientUser));
          return true;
        }
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<RegisteredUser, 'id' | 'registeredAt'>): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check if user already exists
      const existsWhatsApp = registeredUsers.some(u => u.whatsapp === userData.whatsapp);
      const existsName = registeredUsers.some(
        u => u.firstName.toLowerCase() === userData.firstName.toLowerCase() && 
             u.whatsappLast4 === userData.whatsappLast4
      );

      if (existsWhatsApp || existsName) {
        return false;
      }

      const newUser: RegisteredUser = {
        ...userData,
        id: Date.now().toString(),
        registeredAt: new Date()
      };

      setRegisteredUsers(prev => [...prev, newUser]);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cgpl-auth-user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      registeredUsers,
      login,
      register,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};