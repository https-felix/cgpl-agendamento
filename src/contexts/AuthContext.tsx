import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RegisteredUser } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load registered users from Supabase
  const loadRegisteredUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error('Error loading registered users:', error);
        return;
      }

      const users: RegisteredUser[] = data.map(profile => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        whatsapp: profile.whatsapp,
        whatsappLast4: profile.whatsapp_last4,
        email: profile.email,
        registeredAt: new Date(profile.created_at)
      }));

      setRegisteredUsers(users);
    } catch (error) {
      console.error('Error loading registered users:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // For authenticated users, load their profile
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              const clientUser: User = {
                id: profile.id,
                firstName: profile.first_name,
                fullName: `${profile.first_name} ${profile.last_name}`,
                role: 'client',
                whatsappLast4: profile.whatsapp_last4
              };
              setUser(clientUser);
            }
          }, 0);
        } else {
          // Check for planner login in localStorage
          const storedUser = localStorage.getItem('cgpl-auth-user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role === 'planner') {
              setUser(parsedUser);
            } else {
              setUser(null);
              localStorage.removeItem('cgpl-auth-user');
            }
          } else {
            setUser(null);
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        // Check for planner login in localStorage
        const storedUser = localStorage.getItem('cgpl-auth-user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'planner') {
            setUser(parsedUser);
          }
        }
      }
      setIsLoading(false);
    });

    // Load registered users
    loadRegisteredUsers();

    return () => subscription.unsubscribe();
  }, []);

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
          // Create client user without Supabase auth
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
      // Check if user already exists directly in profiles table
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('whatsapp, first_name, whatsapp_last4')
        .or(`whatsapp.eq.${userData.whatsapp},and(first_name.eq.${userData.firstName},whatsapp_last4.eq.${userData.whatsappLast4})`)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError);
        return false;
      }

      if (existingProfile) {
        return false; // User already exists
      }

      // Insert profile directly without Supabase auth
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          first_name: userData.firstName,
          last_name: userData.lastName,
          whatsapp: userData.whatsapp,
          whatsapp_last4: userData.whatsappLast4,
          email: userData.email || null
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return false;
      }

      // Reload registered users
      await loadRegisteredUsers();
      
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (user?.role === 'planner') {
      setUser(null);
      localStorage.removeItem('cgpl-auth-user');
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
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