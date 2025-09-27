// CGPL Soluções - Sistema de Chamados Prediais
// Data Types and Interfaces

export interface User {
  id: string;
  firstName: string;
  fullName: string;
  role: 'client' | 'planner';
  whatsappLast4?: string;
}

export interface RegisteredUser {
  id: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  whatsappLast4: string;
  email?: string;
  registeredAt: Date;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'pending' | 'scheduled' | 'in-progress' | 'completed';
export type PaymentMethod = 'pix' | 'cash' | 'card' | 'transfer' | 'boleto';

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Payment {
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  paidAt?: Date;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  location: string;
  requester: string;
  contact: string;
  status: Status;
  createdAt: Date;
  scheduledDays?: number;
  scheduledDate?: Date;
  completedAt?: Date;
  payment?: Payment;
  userId: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
  totalRevenue: number;
  pendingPayments: number;
}

// Service Categories Configuration
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'hydraulic',
    name: 'Hidráulica',
    icon: 'Wrench',
    description: 'Reparos em encanamentos, torneiras, válvulas'
  },
  {
    id: 'electrical',
    name: 'Elétrica',
    icon: 'Zap',
    description: 'Instalações elétricas, tomadas, iluminação'
  },
  {
    id: 'air-conditioning',
    name: 'Ar Condicionado',
    icon: 'Wind',
    description: 'Manutenção e reparo de sistemas de climatização'
  },
  {
    id: 'cleaning',
    name: 'Limpeza',
    icon: 'Sparkles',
    description: 'Limpeza profunda, manutenção de áreas comuns'
  },
  {
    id: 'carpentry',
    name: 'Carpintaria',
    icon: 'Hammer',
    description: 'Reparos em portas, janelas, móveis'
  },
  {
    id: 'painting',
    name: 'Pintura',
    icon: 'Brush',
    description: 'Pintura de paredes, retoques, acabamentos'
  },
  {
    id: 'security',
    name: 'Segurança',
    icon: 'Shield',
    description: 'Fechaduras, portões, sistemas de segurança'
  },
  {
    id: 'gardening',
    name: 'Jardinagem',
    icon: 'TreePine',
    description: 'Manutenção de jardins e áreas verdes'
  },
  {
    id: 'other',
    name: 'Outros',
    icon: 'Settings',
    description: 'Outros serviços não listados'
  }
];

// Status and Priority Labels
export const STATUS_LABELS: Record<Status, string> = {
  pending: 'Pendente',
  scheduled: 'Agendado',
  'in-progress': 'Em Andamento',
  completed: 'Concluído'
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  card: 'Cartão',
  transfer: 'Transferência',
  boleto: 'Boleto'
};