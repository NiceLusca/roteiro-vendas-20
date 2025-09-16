import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SecurityHeadersProps {
  nonce?: string;
  environment?: 'development' | 'production';
}

export function SecurityHeaders({ 
  nonce, 
  environment = 'production' 
}: SecurityHeadersProps) {
  
  // Content Security Policy
  const csp = environment === 'development'
    ? `default-src 'self' 'unsafe-inline' 'unsafe-eval' https://vowcctjqbwndmdxfuqjd.supabase.co wss://vowcctjqbwndmdxfuqjd.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com data: blob:; 
       script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vowcctjqbwndmdxfuqjd.supabase.co; 
       style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
       font-src 'self' https://fonts.gstatic.com data:; 
       img-src 'self' data: blob: https:; 
       connect-src 'self' https://vowcctjqbwndmdxfuqjd.supabase.co wss://vowcctjqbwndmdxfuqjd.supabase.co;`
    : `default-src 'self'; 
       script-src 'self' ${nonce ? `'nonce-${nonce}'` : "'strict-dynamic'"}; 
       style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
       font-src 'self' https://fonts.gstatic.com data:; 
       img-src 'self' data: blob: https:; 
       connect-src 'self' https://vowcctjqbwndmdxfuqjd.supabase.co wss://vowcctjqbwndmdxfuqjd.supabase.co; 
       frame-ancestors 'none'; 
       base-uri 'self'; 
       form-action 'self';`;

  useEffect(() => {
    // Verificar se estamos em produção para aplicar headers mais rigorosos
    if (environment === 'production' && typeof window !== 'undefined') {
      // Log de configurações de segurança aplicadas
      console.log('🔒 Headers de segurança aplicados:', {
        csp: 'Content Security Policy ativo',
        hsts: 'HTTP Strict Transport Security ativo',
        nosniff: 'X-Content-Type-Options: nosniff',
        xss: 'X-XSS-Protection ativo',
        frameOptions: 'X-Frame-Options: DENY'
      });
    }
  }, [environment]);

  return (
    <Helmet>
      {/* Content Security Policy */}
      <meta httpEquiv="Content-Security-Policy" content={csp} />
      
      {/* HTTP Strict Transport Security (apenas HTTPS) */}
      {environment === 'production' && (
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />
      )}
      
      {/* X-Content-Type-Options */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* X-Frame-Options */}
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      
      {/* X-XSS-Protection */}
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Referrer Policy */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Permissions Policy */}
      <meta 
        httpEquiv="Permissions-Policy" 
        content="camera=(), microphone=(), geolocation=(), interest-cohort=()" 
      />
      
      {/* Cross-Origin Policies */}
      <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
      <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
      <meta httpEquiv="Cross-Origin-Resource-Policy" content="same-origin" />
    </Helmet>
  );
}