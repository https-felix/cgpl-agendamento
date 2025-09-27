import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Edit, DollarSign, User, MapPin, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useService } from '@/contexts/ServiceContext';
import { ServiceRequest, STATUS_LABELS, PRIORITY_LABELS, SERVICE_CATEGORIES, Status } from '@/types';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

interface ServiceRequestCardProps {
  request: ServiceRequest;
}

export const ServiceRequestCard: React.FC<ServiceRequestCardProps> = ({ request }) => {
  const { updateServiceRequest } = useService();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    status: request.status,
    scheduledDays: request.scheduledDays || 3,
    paymentAmount: request.payment?.amount || 0,
    paymentNotes: request.payment?.notes || ''
  });

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'scheduled':
        return 'status-scheduled';
      case 'in-progress':
        return 'status-in-progress';
      case 'completed':
        return 'status-completed';
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
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return SERVICE_CATEGORIES.find(cat => cat.id === categoryId) || SERVICE_CATEGORIES[8];
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Icons.Settings className="w-4 h-4" />;
  };

  const handleSaveChanges = () => {
    const updates: Partial<ServiceRequest> = {
      status: editData.status
    };

    // If scheduling
    if (editData.status === 'scheduled' && editData.scheduledDays > 0) {
      updates.scheduledDays = editData.scheduledDays;
      updates.scheduledDate = addDays(new Date(), editData.scheduledDays);
    }

    // If completing and adding payment
    if (editData.status === 'completed') {
      updates.completedAt = new Date();
      if (editData.paymentAmount > 0) {
        updates.payment = {
          amount: editData.paymentAmount,
          dueDate: addDays(new Date(), 7), // 7 days to pay
          isPaid: false,
          notes: editData.paymentNotes
        };
      }
    }

    updateServiceRequest(request.id, updates);
    toast.success('Chamado atualizado com sucesso!');
    setIsEditDialogOpen(false);
  };

  const categoryInfo = getCategoryInfo(request.category);
  const isOverdue = request.scheduledDate && request.scheduledDate < new Date() && request.status !== 'completed';

  return (
    <Card className={`shadow-soft transition-smooth hover:shadow-medium border-l-4 ${
      isOverdue ? 'border-l-destructive' : `border-l-${getStatusColor(request.status).replace('status-', '')}`
    }`}>
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
              {isOverdue && (
                <Badge variant="destructive" className="animate-pulse">
                  Atrasado
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-3">{request.description}</p>
          </div>
          
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Chamado</DialogTitle>
                <DialogDescription>
                  Atualize o status e informações do chamado
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editData.status} onValueChange={(value) => setEditData(prev => ({ ...prev, status: value as Status }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="in-progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editData.status === 'scheduled' && (
                  <div className="space-y-2">
                    <Label>Prazo em dias corridos</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editData.scheduledDays}
                      onChange={(e) => setEditData(prev => ({ ...prev, scheduledDays: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                )}

                {editData.status === 'completed' && (
                  <>
                    <div className="space-y-2">
                      <Label>Valor do Serviço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.paymentAmount}
                        onChange={(e) => setEditData(prev => ({ ...prev, paymentAmount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Observações do Pagamento</Label>
                      <Input
                        placeholder="Observações sobre o serviço ou pagamento"
                        value={editData.paymentNotes}
                        onChange={(e) => setEditData(prev => ({ ...prev, paymentNotes: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveChanges} className="flex-1 bg-gradient-primary">
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Request Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            {getCategoryIcon(categoryInfo.icon)}
            <span className="font-medium">Categoria:</span>
            <span>{categoryInfo.name}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Local:</span>
            <span>{request.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Solicitante:</span>
            <span>{request.requester}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Contato:</span>
            <span>{request.contact}</span>
          </div>
        </div>

        {/* Priority and Dates */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Prioridade:</span>
            <Badge className={`${getPriorityColor(request.priority)} border text-xs`}>
              {PRIORITY_LABELS[request.priority]}
            </Badge>
          </div>
          
          {request.scheduledDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Agendado para:</span>
              <span>{format(request.scheduledDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
              <span className="text-muted-foreground">
                ({request.scheduledDays} dias corridos)
              </span>
            </div>
          )}
        </div>

        {/* Payment Information */}
        {request.payment && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="font-medium">Informações de Pagamento</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Valor:</span>
                <span className="ml-2">R$ {request.payment.amount.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Vencimento:</span>
                <span className="ml-2">{format(request.payment.dueDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge 
                  className={`ml-2 text-xs ${request.payment.isPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
                >
                  {request.payment.isPaid ? 'Pago' : 'Pendente'}
                </Badge>
              </div>
            </div>
            {request.payment.notes && (
              <div className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium">Observações:</span> {request.payment.notes}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <div>
            Criado em {format(request.createdAt, 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
          </div>
          {request.completedAt && (
            <div>
              Concluído em {format(request.completedAt, 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};