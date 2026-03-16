import { Helmet } from 'react-helmet-async';

interface SecurityHeadersProps {
  nonce?: string;
  environment?: 'development' | 'production';
}

export function SecurityHeaders({ 
  nonce, 
  environment = 'production' 
}: SecurityHeadersProps) {
  
  // CSP only applied in development where unsafe-inline is acceptable
  // In production, CSP should be configured at the CDN/server level with proper nonces
  const csp = environment === 'development'
    ? `default-src 'self' 'unsafe-inline' 'unsafe-eval' https://szuqdfakikbotidnxxvw.supabase.co wss://szuqdfakikbotidnxxvw.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com data: blob:; 
       script-src 'self' 'unsafe-inline' 'unsafe-eval' https://szuqdfakikbotidnxxvw.supabase.co; 
       style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
       font-src 'self' https://fonts.gstatic.com data:; 
       img-src 'self' data: blob: https:; 
       connect-src 'self' https://szuqdfakikbotidnxxvw.supabase.co wss://szuqdfakikbotidnxxvw.supabase.co;`
    : null;

  return (
    <Helmet>
      {/* CSP only in development - production should use server-side headers */}
      {csp && <meta httpEquiv="Content-Security-Policy" content={csp} />}
      
      {/* X-Content-Type-Options */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* X-Frame-Options */}
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      
      {/* X-XSS-Protection */}
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Referrer Policy */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
    </Helmet>
  );
}
