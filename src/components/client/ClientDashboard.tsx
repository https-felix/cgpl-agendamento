import React, { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/contexts/ServiceContext';
import { CreateServiceRequestDialog } from './CreateServiceRequestDialog';
import { STATUS_LABELS, PRIORITY_LABELS, SERVICE_CATEGORIES } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getServiceRequestsByUser } = useService();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const userRequests = user ? getServiceRequestsByUser(user.id) : [];
  
  console.log('User ID:', user?.id);
  console.log('User requests:', userRequests.length, userRequests.map(r => ({ id: r.id, userId: r.userId, title: r.title })));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'scheduled':
        return 'status-scheduled';
      case 'in-progress':
        return 'status-in-progress';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'priority-low';
      case 'medium':
        return 'priority-medium';
      case 'high':
        return 'priority-high';
      case 'urgent':
        return 'priority-urgent';
      default:
        return 'priority-low';
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return SERVICE_CATEGORIES.find(cat => cat.id === categoryId) || SERVICE_CATEGORIES[8]; // default to 'other'
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-card rounded-2xl p-8 shadow-medium">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Olá, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie seus chamados de serviços prediais
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-primary hover:opacity-90 transition-smooth shadow-glow"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Chamado
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-soft border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{userRequests.length}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">
                  {userRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agendados</p>
                <p className="text-2xl font-bold">
                  {userRequests.filter(r => r.status === 'scheduled').length}
                </p>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">
                  {userRequests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Requests List */}
      <Card className="shadow-medium border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Meus Chamados
          </CardTitle>
          <CardDescription>
            Acompanhe o status dos seus chamados de serviço
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRequests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum chamado encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não possui chamados registrados.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Chamado
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userRequests.map((request) => {
                const categoryInfo = getCategoryInfo(request.category);
                return (
                  <Card key={request.id} className="border shadow-soft transition-smooth hover:shadow-medium">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{request.title}</h3>
                            <Badge className={`${getStatusColor(request.status)} border`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                {STATUS_LABELS[request.status]}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{request.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Categoria:</span>
                              <span>{categoryInfo.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Local:</span>
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Prioridade:</span>
                              <Badge className={`${getPriorityColor(request.priority)} border text-xs`}>
                                {PRIORITY_LABELS[request.priority]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                        <div>
                          Criado em {format(request.createdAt, 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                        </div>
                        {request.scheduledDate && (
                          <div>
                            Agendado para {format(request.scheduledDate, 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Informação:</strong> Nossa equipe administrativa avaliará seu chamado e retornará com o prazo em até 3 dias úteis.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Service Request Dialog */}
      <CreateServiceRequestDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};