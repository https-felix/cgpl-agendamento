import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceRequest, DashboardStats, Status, Priority, Payment } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ServiceContextType {
  serviceRequests: ServiceRequest[];
  dashboardStats: DashboardStats;
  createServiceRequest: (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'userId'>) => Promise<string>;
  updateServiceRequest: (id: string, updates: Partial<ServiceRequest>) => Promise<void>;
  deleteServiceRequest: (id: string) => Promise<void>;
  getServiceRequestsByUser: (userId: string) => ServiceRequest[];
  getServiceRequestsByStatus: (status: Status) => ServiceRequest[];
  markPaymentAsPaid: (requestId: string, paymentMethod: string, notes?: string) => Promise<void>;
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
  const { user, session } = useAuth();

  // Load service requests from Supabase
  const loadServiceRequests = async () => {
    try {
      console.log('Loading service requests from Supabase...');
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading service requests:', error);
        return;
      }

      console.log('Loaded requests from DB:', data.length);
      const requests: ServiceRequest[] = data.map(req => ({
        id: req.id,
        title: req.title,
        description: req.description,
        priority: req.priority as Priority,
        category: req.category,
        location: req.location,
        requester: req.requester,
        contact: req.contact,
        status: req.status as Status,
        createdAt: new Date(req.created_at),
        scheduledDays: req.scheduled_days,
        scheduledDate: req.scheduled_date ? new Date(req.scheduled_date) : undefined,
        completedAt: req.completed_at ? new Date(req.completed_at) : undefined,
        userId: req.user_id,
        payment: req.payment_amount ? {
          amount: Number(req.payment_amount),
          dueDate: new Date(req.payment_due_date),
          isPaid: req.payment_is_paid,
          paidAt: req.payment_paid_at ? new Date(req.payment_paid_at) : undefined,
          paymentMethod: req.payment_method as any,
          notes: req.payment_notes
        } : undefined
      }));

      setServiceRequests(requests);
    } catch (error) {
      console.error('Error loading service requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from Supabase
  useEffect(() => {
    loadServiceRequests();
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    console.log('Setting up realtime subscription...');
    const subscription = supabase
      .channel('service_requests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'service_requests' },
        (payload) => {
          console.log('Realtime event received:', payload.eventType, payload);
          loadServiceRequests();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from realtime...');
      subscription.unsubscribe();
    };
  }, []);

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

  const createServiceRequest = async (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'userId'>): Promise<string> => {
    if (!user) throw new Error('User must be logged in to create requests');
    
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          title: request.title,
          description: request.description,
          priority: request.priority,
          category: request.category,
          location: request.location,
          requester: request.requester,
          contact: request.contact,
          status: request.status,
          scheduled_days: request.scheduledDays,
          scheduled_date: request.scheduledDate?.toISOString(),
          completed_at: request.completedAt?.toISOString(),
          payment_amount: request.payment?.amount,
          payment_due_date: request.payment?.dueDate?.toISOString(),
          payment_is_paid: request.payment?.isPaid || false,
          payment_paid_at: request.payment?.paidAt?.toISOString(),
          payment_method: request.payment?.paymentMethod,
          payment_notes: request.payment?.notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating service request:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  };

  const updateServiceRequest = async (id: string, updates: Partial<ServiceRequest>) => {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.category) updateData.category = updates.category;
      if (updates.location) updateData.location = updates.location;
      if (updates.requester) updateData.requester = updates.requester;
      if (updates.contact) updateData.contact = updates.contact;
      if (updates.status) updateData.status = updates.status;
      if (updates.scheduledDays) updateData.scheduled_days = updates.scheduledDays;
      if (updates.scheduledDate) updateData.scheduled_date = updates.scheduledDate.toISOString();
      if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();
      
      if (updates.payment) {
        updateData.payment_amount = updates.payment.amount;
        updateData.payment_due_date = updates.payment.dueDate?.toISOString();
        updateData.payment_is_paid = updates.payment.isPaid;
        updateData.payment_paid_at = updates.payment.paidAt?.toISOString();
        updateData.payment_method = updates.payment.paymentMethod;
        updateData.payment_notes = updates.payment.notes;
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating service request:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating service request:', error);
      throw error;
    }
  };

  const deleteServiceRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting service request:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting service request:', error);
      throw error;
    }
  };

  const markPaymentAsPaid = async (requestId: string, paymentMethod: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          payment_is_paid: true,
          payment_paid_at: new Date().toISOString(),
          payment_method: paymentMethod,
          payment_notes: notes
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error marking payment as paid:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      throw error;
    }
  };

  const getServiceRequestsByUser = (userId: string): ServiceRequest[] => {
    return serviceRequests.filter(request => request.userId === userId);
  };

  const getServiceRequestsByStatus = (status: Status): ServiceRequest[] => {
    return serviceRequests.filter(request => request.status === status);
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