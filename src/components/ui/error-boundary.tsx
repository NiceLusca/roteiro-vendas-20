import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

/**
 * Enhanced Error Boundary with better error handling and reporting
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';
    
    // Log error with structured logging
    logger.error('Error Boundary caught error', error, {
      feature: 'error-boundary',
      action: 'component-error',
      metadata: {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name
      }
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo, errorId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // In production, send to error tracking service (e.g., Sentry)
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(() => {
        // Silently fail - don't create more errors
      });
    } catch {
      // Silently fail - don't create more errors
    }
  };

  private handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Ops! Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada automaticamente.
              </CardDescription>
              {this.state.errorId && (
                <div className="text-xs text-muted-foreground mt-2">
                  ID do Erro: {this.state.errorId}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="text-sm font-semibold mb-1 flex items-center">
                      <Bug className="w-4 h-4 mr-1" />
                      Erro (modo desenvolvimento):
                    </h4>
                    <p className="text-sm font-mono text-muted-foreground break-words">
                      {this.state.error.message}
                    </p>
                  </div>
                  {this.state.error.stack && (
                    <details className="rounded-lg bg-muted p-3">
                      <summary className="text-sm font-semibold cursor-pointer">
                        Stack trace (clique para expandir)
                      </summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-48 text-muted-foreground">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <details className="rounded-lg bg-muted p-3">
                      <summary className="text-sm font-semibold cursor-pointer">
                        Component stack (clique para expandir)
                      </summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-48 text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={this.handleReload}
                    className="flex-1"
                  >
                    Recarregar página
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Início
                  </Button>
                </div>
              </div>

              {process.env.NODE_ENV === 'production' && (
                <div className="text-center text-xs text-muted-foreground">
                  Se o problema persistir, entre em contato com o suporte
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}