import React, { useState } from 'react';
import { Building2, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const LoginForm: React.FC = () => {
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    firstName: '',
    whatsappLast4: '',
    plannerPassword: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    whatsapp: '',
    email: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.firstName.trim()) {
      toast.error('Por favor, informe seu primeiro nome');
      return;
    }

    // Check if it's planner login
    if (loginData.plannerPassword.trim()) {
      if (loginData.plannerPassword === '123456') {
        const success = await login(loginData.firstName, undefined, loginData.plannerPassword);
        if (success) {
          toast.success('Login do planejador realizado com sucesso!');
        } else {
          toast.error('Erro no login do planejador');
        }
      } else {
        toast.error('Senha do planejador incorreta');
      }
      return;
    }

    // Client login
    if (!loginData.whatsappLast4.trim()) {
      toast.error('Por favor, informe os últimos 4 dígitos do WhatsApp');
      return;
    }

    if (loginData.whatsappLast4.length !== 4) {
      toast.error('Os últimos 4 dígitos devem ter exatamente 4 números');
      return;
    }

    const success = await login(loginData.firstName, loginData.whatsappLast4);
    if (success) {
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Dados não encontrados. Verifique as informações ou cadastre-se primeiro.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.firstName.trim() || !registerData.lastName.trim() || !registerData.whatsapp.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (registerData.whatsapp.length < 10) {
      toast.error('WhatsApp deve ter pelo menos 10 dígitos');
      return;
    }

    // Extract last 4 digits
    const whatsappLast4 = registerData.whatsapp.slice(-4);
    
    const success = await register({
      ...registerData,
      whatsappLast4
    });

    if (success) {
      toast.success('Cadastro realizado com sucesso! Agora você pode fazer login.');
      // Clear form
      setRegisterData({
        firstName: '',
        lastName: '',
        whatsapp: '',
        email: ''
      });
    } else {
      toast.error('Erro no cadastro. Usuário já existe ou dados inválidos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-2xl shadow-strong mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CGPL Soluções</h1>
          <p className="text-white/80">Sistema de Chamados Prediais</p>
        </div>

        <Card className="shadow-strong border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais ou cadastre-se
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Primeiro Nome</Label>
                    <Input
                      id="firstName"
                      placeholder="Seu primeiro nome"
                      value={loginData.firstName}
                      onChange={(e) => setLoginData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="transition-smooth"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappLast4">Últimos 4 dígitos do WhatsApp</Label>
                    <Input
                      id="whatsappLast4"
                      placeholder="0000"
                      maxLength={4}
                      value={loginData.whatsappLast4}
                      onChange={(e) => setLoginData(prev => ({ ...prev, whatsappLast4: e.target.value }))}
                      className="transition-smooth"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plannerPassword">Senha do Planejador (opcional)</Label>
                    <div className="relative">
                      <Input
                        id="plannerPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Senha do planejador"
                        value={loginData.plannerPassword}
                        onChange={(e) => setLoginData(prev => ({ ...prev, plannerPassword: e.target.value }))}
                        className="pr-10 transition-smooth"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-smooth">
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="regFirstName">Primeiro Nome *</Label>
                      <Input
                        id="regFirstName"
                        placeholder="João"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="transition-smooth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regLastName">Sobrenome *</Label>
                      <Input
                        id="regLastName"
                        placeholder="Silva"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="transition-smooth"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regWhatsapp">WhatsApp *</Label>
                    <Input
                      id="regWhatsapp"
                      placeholder="(11) 99999-9999"
                      value={registerData.whatsapp}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="transition-smooth"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regEmail">E-mail (opcional)</Label>
                    <Input
                      id="regEmail"
                      type="email"
                      placeholder="joao@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      className="transition-smooth"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-smooth">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-white/60 text-sm">
          <p>Sistema desenvolvido para CGPL Soluções</p>
          <p>© 2024 - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};