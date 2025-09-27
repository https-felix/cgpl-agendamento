import React, { useState } from 'react';
import { Plus, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { useService } from '@/contexts/ServiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Priority, SERVICE_CATEGORIES, PRIORITY_LABELS } from '@/types';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

interface CreateServiceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateServiceRequestDialog: React.FC<CreateServiceRequestDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { createServiceRequest } = useService();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    contact: '',
    priority: 'medium' as Priority
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      location: '',
      contact: '',
      priority: 'medium'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para criar um chamado');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.location.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = createServiceRequest({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        contact: formData.contact.trim() || `WhatsApp: ${user.whatsappLast4}`,
        priority: formData.priority,
        requester: user.fullName,
        status: 'pending'
      });

      toast.success('Chamado criado com sucesso!', {
        description: 'Nossa equipe administrativa avaliará e retornará com prazo em até 3 dias úteis.'
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao criar chamado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Icons.Settings className="w-5 h-5" />;
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'low':
        return 'text-muted-foreground';
      case 'medium':
        return 'text-warning';
      case 'high':
        return 'text-destructive';
      case 'urgent':
        return 'text-urgent';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Criar Novo Chamado
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do serviço que precisa ser realizado. Nossa equipe avaliará e retornará com prazo em até 3 dias úteis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Chamado *</Label>
              <Input
                id="title"
                placeholder="Ex: Vazamento na torneira da cozinha"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="transition-smooth"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada *</Label>
              <Textarea
                id="description"
                placeholder="Descreva o problema ou serviço necessário com detalhes..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="transition-smooth resize-none"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label>Categoria do Serviço *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SERVICE_CATEGORIES.map((category) => (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-smooth border-2 hover:shadow-medium ${
                    formData.category === category.id
                      ? 'border-primary bg-primary/5 shadow-glow'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-2 rounded-lg ${
                        formData.category === category.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {getCategoryIcon(category.icon)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Location and Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Local do Serviço *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Ex: Apartamento 301 - Cozinha"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="pl-10 transition-smooth"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contato Alternativo (opcional)</Label>
              <Input
                id="contact"
                placeholder="Telefone ou e-mail adicional"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                className="transition-smooth"
              />
            </div>
          </div>

          {/* Priority Selection */}
          <div className="space-y-3">
            <Label>Prioridade do Chamado</Label>
            <RadioGroup
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Priority }))}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => (
                <div key={priority}>
                  <Label
                    htmlFor={`priority-${priority}`}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-smooth ${
                      formData.priority === priority
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={priority} id={`priority-${priority}`} />
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${getPriorityColor(priority)}`} />
                      <span className="font-medium">{PRIORITY_LABELS[priority]}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Information Box */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm">Informações Importantes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nossa equipe administrativa avaliará seu chamado</li>
                  <li>• Retornaremos com prazo de atendimento em até 3 dias úteis</li>
                  <li>• Você será notificado sobre o agendamento e status</li>
                  <li>• O valor do serviço será informado após a conclusão</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
            >
              {isSubmitting ? 'Criando...' : 'Criar Chamado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};