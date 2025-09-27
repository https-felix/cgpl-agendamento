import React, { useState } from 'react';
import { DollarSign, CreditCard, Calendar, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useService } from '@/contexts/ServiceContext';
import { PAYMENT_METHOD_LABELS } from '@/types';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const FinancialTab: React.FC = () => {
  const { serviceRequests, dashboardStats, markPaymentAsPaid } = useService();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');

  // Get requests with payments
  const requestsWithPayments = serviceRequests.filter(request => 
    request.status === 'completed' && request.payment
  );

  const paidRequests = requestsWithPayments.filter(request => request.payment?.isPaid);
  const pendingRequests = requestsWithPayments.filter(request => !request.payment?.isPaid);
  const overdueRequests = pendingRequests.filter(request => 
    request.payment && isAfter(new Date(), request.payment.dueDate)
  );

  const totalPaid = paidRequests.reduce((sum, request) => sum + (request.payment?.amount || 0), 0);
  const totalPending = pendingRequests.reduce((sum, request) => sum + (request.payment?.amount || 0), 0);
  const totalOverdue = overdueRequests.reduce((sum, request) => sum + (request.payment?.amount || 0), 0);

  const handleMarkAsPaid = () => {
    if (!selectedRequestId || !selectedPaymentMethod) {
      toast.error('Selecione o método de pagamento');
      return;
    }

    markPaymentAsPaid(selectedRequestId, selectedPaymentMethod, paymentNotes);
    toast.success('Pagamento marcado como pago!');
    
    // Reset form
    setSelectedRequestId('');
    setSelectedPaymentMethod('');
    setPaymentNotes('');
  };

  const financialStats = [
    {
      title: 'Receita Total',
      value: `R$ ${dashboardStats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Pagamentos Recebidos',
      value: `R$ ${totalPaid.toFixed(2)}`,
      count: paidRequests.length,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Pagamentos Pendentes',
      value: `R$ ${totalPending.toFixed(2)}`,
      count: pendingRequests.length,
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Pagamentos Vencidos',
      value: `R$ ${totalOverdue.toFixed(2)}`,
      count: overdueRequests.length,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map((stat, index) => (
          <Card key={index} className="shadow-soft border-0 bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold mt-1">{stat.value}</p>
                  {'count' in stat && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.count} {stat.count === 1 ? 'pagamento' : 'pagamentos'}
                    </p>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payments Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <Card className="shadow-medium border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-warning" />
              Pagamentos Pendentes
            </CardTitle>
            <CardDescription>
              {pendingRequests.length} pagamentos aguardando confirmação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
                <h3 className="text-lg font-semibold mb-2">Todos os pagamentos em dia!</h3>
                <p className="text-muted-foreground">
                  Não há pagamentos pendentes no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => {
                  const isOverdue = request.payment && isAfter(new Date(), request.payment.dueDate);
                  return (
                    <Card key={request.id} className={`border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{request.title}</h4>
                            <p className="text-sm text-muted-foreground">{request.requester}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">R$ {request.payment!.amount.toFixed(2)}</p>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Vencido
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Vence em: {format(request.payment!.dueDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-gradient-primary"
                                onClick={() => setSelectedRequestId(request.id)}
                              >
                                Marcar como Pago
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Confirmar Pagamento</DialogTitle>
                                <DialogDescription>
                                  Marque o pagamento como recebido
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                  <p className="font-semibold">{request.title}</p>
                                  <p className="text-sm text-muted-foreground">{request.requester}</p>
                                  <p className="text-lg font-bold text-success">R$ {request.payment!.amount.toFixed(2)}</p>
                                </div>

                                <div className="space-y-2">
                                  <Label>Método de Pagamento</Label>
                                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                          {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Observações (opcional)</Label>
                                  <Textarea
                                    placeholder="Adicione observações sobre o pagamento..."
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button variant="outline" className="flex-1">
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleMarkAsPaid} className="flex-1 bg-gradient-primary">
                                    Confirmar Pagamento
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Paid Payments */}
        <Card className="shadow-medium border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Pagamentos Recebidos
            </CardTitle>
            <CardDescription>
              Últimos {Math.min(paidRequests.length, 5)} pagamentos confirmados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paidRequests.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pagamento recebido</h3>
                <p className="text-muted-foreground">
                  Os pagamentos confirmados aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paidRequests.slice(0, 5).map((request) => (
                  <Card key={request.id} className="border border-success/20 bg-success/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">{request.title}</h4>
                          <p className="text-sm text-muted-foreground">{request.requester}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-success">R$ {request.payment!.amount.toFixed(2)}</p>
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">
                            Pago
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span>{PAYMENT_METHOD_LABELS[request.payment!.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>{format(request.payment!.paidAt!, 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      </div>
                      
                      {request.payment!.notes && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                          <strong>Obs:</strong> {request.payment!.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};