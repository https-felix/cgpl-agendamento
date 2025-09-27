import React, { useState } from 'react';
import { BarChart3, Calendar, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useService } from '@/contexts/ServiceContext';
import { ServiceRequestCard } from './ServiceRequestCard';
import { FinancialTab } from './FinancialTab';

export const PlannerDashboard: React.FC = () => {
  const { 
    serviceRequests, 
    dashboardStats, 
    getServiceRequestsByStatus 
  } = useService();

  const pendingRequests = getServiceRequestsByStatus('pending');
  const scheduledRequests = getServiceRequestsByStatus('scheduled');
  const inProgressRequests = getServiceRequestsByStatus('in-progress');
  const completedRequests = getServiceRequestsByStatus('completed');

  const statCards = [
    {
      title: 'Total de Chamados',
      value: dashboardStats.total,
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Pendentes',
      value: dashboardStats.pending,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Agendados',
      value: dashboardStats.scheduled,
      icon: Calendar,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: 'Em Andamento',
      value: dashboardStats.inProgress,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Concluídos',
      value: dashboardStats.completed,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Receita Total',
      value: `R$ ${dashboardStats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-card rounded-2xl p-8 shadow-medium">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard do Planejador
        </h1>
        <p className="text-muted-foreground text-lg">
          Gerencie todos os chamados e serviços da CGPL Soluções
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="shadow-soft border-0 bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Card className="shadow-medium border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Gerenciamento de Chamados
          </CardTitle>
          <CardDescription>
            Visualize e gerencie todos os chamados por status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendentes
                {dashboardStats.pending > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {dashboardStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Agendados
                {dashboardStats.scheduled > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {dashboardStats.scheduled}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Em Andamento
                {dashboardStats.inProgress > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {dashboardStats.inProgress}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Concluídos
                {dashboardStats.completed > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {dashboardStats.completed}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financeiro
                {dashboardStats.pendingPayments > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {dashboardStats.pendingPayments}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Chamados Pendentes</h3>
                  <Badge className="status-pending border">
                    {pendingRequests.length} chamados aguardando análise
                  </Badge>
                </div>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum chamado pendente</h3>
                    <p className="text-muted-foreground">
                      Todos os chamados foram processados.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingRequests.map((request) => (
                      <ServiceRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Chamados Agendados</h3>
                  <Badge className="status-scheduled border">
                    {scheduledRequests.length} chamados com data definida
                  </Badge>
                </div>
                {scheduledRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum chamado agendado</h3>
                    <p className="text-muted-foreground">
                      Não há serviços agendados no momento.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {scheduledRequests.map((request) => (
                      <ServiceRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Chamados em Andamento</h3>
                  <Badge className="status-in-progress border">
                    {inProgressRequests.length} chamados sendo executados
                  </Badge>
                </div>
                {inProgressRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum chamado em andamento</h3>
                    <p className="text-muted-foreground">
                      Não há serviços sendo executados no momento.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {inProgressRequests.map((request) => (
                      <ServiceRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Chamados Concluídos</h3>
                  <Badge className="status-completed border">
                    {completedRequests.length} chamados finalizados
                  </Badge>
                </div>
                {completedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum chamado concluído</h3>
                    <p className="text-muted-foreground">
                      Ainda não há serviços concluídos.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {completedRequests.map((request) => (
                      <ServiceRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
              <FinancialTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};