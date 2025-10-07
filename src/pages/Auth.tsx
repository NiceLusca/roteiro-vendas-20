import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContextSecure';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      setIsSubmitting(false);

      if (error) {
        let errorMessage = 'Erro ao fazer login';
        
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.message?.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique se as URLs estão configuradas no Supabase (Authentication > URL Configuration)';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Login error:', error);
      } else {
        toast.success('Login realizado com sucesso!');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMessage = 'Erro de rede. Verifique sua conexão e as configurações do Supabase.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Network error:', err);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password);
      setIsSubmitting(false);

      if (error) {
        let errorMessage = 'Erro ao cadastrar';
        
        if (error.message === 'User already registered') {
          errorMessage = 'Este email já está cadastrado. Faça login.';
        } else if (error.message?.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique se as URLs estão configuradas no Supabase (Authentication > URL Configuration)';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Signup error:', error);
      } else {
        setSuccess('Cadastro realizado! Verifique seu email para confirmar.');
        toast.success('Cadastro realizado com sucesso!');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMessage = 'Erro de rede. Verifique sua conexão e as configurações do Supabase.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Network error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">CRM System</CardTitle>
          <CardDescription>
            Faça login ou cadastre-se para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-500 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value);
              clearMessages();
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearMessages();
                    }}
                    placeholder="seu@email.com"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearMessages();
                      }}
                      placeholder="Sua senha"
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearMessages();
                    }}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha (mínimo 6 caracteres)</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearMessages();
                      }}
                      placeholder="Sua senha"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && password.length > 0 && password.length < 6 && (
                    <p className="text-sm text-destructive">A senha deve ter no mínimo 6 caracteres</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || (password.length > 0 && password.length < 6)}
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}