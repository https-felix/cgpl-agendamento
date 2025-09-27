import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceRequest, DashboardStats, Status, Priority } from '@/types';
import { useAuth } from './AuthContext';

interface ServiceContextType {
  serviceRequests: ServiceRequest[];
  dashboardStats: DashboardStats;
  createServiceRequest: (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'userId'>) => string;
  updateServiceRequest: (id: string, updates: Partial<ServiceRequest>) => void;
  deleteServiceRequest: (id: string) => void;
  getServiceRequestsByUser: (userId: string) => ServiceRequest[];
  getServiceRequestsByStatus: (status: Status) => ServiceRequest[];
  markPaymentAsPaid: (requestId: string, paymentMethod: string, notes?: string) => void;
  isLoading: boolean;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const useService = () => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
};

interface ServiceProviderProps {
  children: React.ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load data from localStorage
  useEffect(() => {
    const storedRequests = localStorage.getItem('cgpl-service-requests');
    
    if (storedRequests) {
      const requests = JSON.parse(storedRequests);
      setServiceRequests(requests.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        scheduledDate: r.scheduledDate ? new Date(r.scheduledDate) : undefined,
        completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        payment: r.payment ? {
          ...r.payment,
          dueDate: new Date(r.payment.dueDate),
          paidAt: r.payment.paidAt ? new Date(r.payment.paidAt) : undefined
        } : undefined
      })));
    } else {
      // Initialize with demo data
      const demoRequests: ServiceRequest[] = [
        {
          id: '1',
          title: 'Vazamento na torneira da cozinha',
          description: 'Torneira da pia da cozinha está pingando constantemente. Já tentei apertar, mas não resolve.',
          priority: 'medium' as Priority,
          category: 'hydraulic',
          location: 'Apartamento 301 - Cozinha',
          requester: 'João Silva',
          contact: '(11) 98765-4321',
          status: 'pending' as Status,
          createdAt: new Date('2024-01-20'),
          userId: '1'
        },
        {
          id: '2',
          title: 'Lâmpada queimada no corredor',
          description: 'Lâmpada do corredor principal queimou. Necessário trocar por LED.',
          priority: 'low' as Priority,
          category: 'electrical',
          location: 'Apartamento 205 - Corredor',
          requester: 'Maria Santos',
          contact: '(11) 97654-3210',
          status: 'completed' as Status,
          createdAt: new Date('2024-01-18'),
          scheduledDays: 2,
          scheduledDate: new Date('2024-01-20'),
          completedAt: new Date('2024-01-20'),
          userId: '2',
          payment: {
            amount: 45.00,
            dueDate: new Date('2024-01-27'),
            isPaid: true,
            paidAt: new Date('2024-01-25'),
            paymentMethod: 'pix',
            notes: 'Pagamento via PIX confirmado'
          }
        },
        {
          id: '3',
          title: 'Ar condicionado não liga',
          description: 'Ar condicionado do quarto não está ligando. Controle funciona mas o aparelho não responde.',
          priority: 'high' as Priority,
          category: 'air-conditioning',
          location: 'Apartamento 102 - Quarto',
          requester: 'Carlos Oliveira',
          contact: '(11) 95432-1098',
          status: 'scheduled' as Status,
          createdAt: new Date('2024-01-19'),
          scheduledDays: 3,
          scheduledDate: new Date('2024-01-22'),
          userId: '3'
        }
      ];
      setServiceRequests(demoRequests);
      localStorage.setItem('cgpl-service-requests', JSON.stringify(demoRequests));
    }
    
    setIsLoading(false);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (serviceRequests.length > 0) {
      localStorage.setItem('cgpl-service-requests', JSON.stringify(serviceRequests));
    }
  }, [serviceRequests]);

  // Calculate dashboard stats
  const dashboardStats: DashboardStats = React.useMemo(() => {
    const now = new Date();
    
    const stats = serviceRequests.reduce((acc, request) => {
      acc.total++;
      
      switch (request.status) {
        case 'pending':
          acc.pending++;
          break;
        case 'scheduled':
          acc.scheduled++;
          // Check if overdue
          if (request.scheduledDate && request.scheduledDate < now) {
            acc.overdue++;
          }
          break;
        case 'in-progress':
          acc.inProgress++;
          break;
        case 'completed':
          acc.completed++;
          if (request.payment) {
            acc.totalRevenue += request.payment.amount;
            if (!request.payment.isPaid) {
              acc.pendingPayments++;
              if (request.payment.dueDate < now) {
                acc.overdue++;
              }
            }
          }
          break;
      }
      
      return acc;
    }, {
      total: 0,
      pending: 0,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      totalRevenue: 0,
      pendingPayments: 0
    });

    return stats;
  }, [serviceRequests]);

  const createServiceRequest = (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'userId'>): string => {
    if (!user) throw new Error('User must be logged in to create requests');
    
    const newRequest: ServiceRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date(),
      userId: user.id
    };
    
    setServiceRequests(prev => [...prev, newRequest]);
    return newRequest.id;
  };

  const updateServiceRequest = (id: string, updates: Partial<ServiceRequest>) => {
    setServiceRequests(prev => 
      prev.map(request => 
        request.id === id ? { ...request, ...updates } : request
      )
    );
  };

  const deleteServiceRequest = (id: string) => {
    setServiceRequests(prev => prev.filter(request => request.id !== id));
  };

  const getServiceRequestsByUser = (userId: string): ServiceRequest[] => {
    return serviceRequests.filter(request => request.userId === userId);
  };

  const getServiceRequestsByStatus = (status: Status): ServiceRequest[] => {
    return serviceRequests.filter(request => request.status === status);
  };

  const markPaymentAsPaid = (requestId: string, paymentMethod: string, notes?: string) => {
    setServiceRequests(prev =>
      prev.map(request =>
        request.id === requestId && request.payment
          ? {
              ...request,
              payment: {
                ...request.payment,
                isPaid: true,
                paidAt: new Date(),
                paymentMethod: paymentMethod as any,
                notes
              }
            }
          : request
      )
    );
  };

  return (
    <ServiceContext.Provider value={{
      serviceRequests,
      dashboardStats,
      createServiceRequest,
      updateServiceRequest,
      deleteServiceRequest,
      getServiceRequestsByUser,
      getServiceRequestsByStatus,
      markPaymentAsPaid,
      isLoading
    }}>
      {children}
    </ServiceContext.Provider>
  );
};