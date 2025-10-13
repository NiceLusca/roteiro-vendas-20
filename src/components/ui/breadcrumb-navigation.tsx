import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    dynamic?: boolean;
  };
}

const breadcrumbConfig: BreadcrumbConfig = {
  '/': { label: 'Dashboard', icon: Home },
  '/pipelines': { label: 'Pipelines' },
  '/pipelines/select': { label: 'Selecionar Pipeline' },
  '/pipelines/[id]': { label: 'Pipeline', dynamic: true },
  '/leads': { label: 'Leads' },
  '/leads/[id]': { label: 'Detalhes do Lead', dynamic: true },
  '/agenda': { label: 'Agenda' },
  '/deals': { label: 'Negociações' },
  '/orders': { label: 'Vendas' },
  '/reports': { label: 'Relatórios' },
  '/settings': { label: 'Configurações' },
  '/settings/pipelines': { label: 'Gerenciar Pipelines' },
  '/settings/products': { label: 'Produtos' },
  '/auth': { label: 'Autenticação' }
};

interface BreadcrumbNavigationProps {
  className?: string;
  customItems?: Array<{
    label: string;
    href?: string;
    isCurrentPage?: boolean;
  }>;
}

export function BreadcrumbNavigation({ className, customItems }: BreadcrumbNavigationProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // If custom items are provided, use them instead
  if (customItems) {
    return (
      <Breadcrumb className={className}>
        <BreadcrumbList>
          {customItems.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.isCurrentPage ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{item.label}</span>
                )}
              </BreadcrumbItem>
              {index < customItems.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Auto-generate breadcrumbs from current path
  const breadcrumbItems = [];
  
  // Always start with home
  breadcrumbItems.push({
    label: 'Dashboard',
    href: '/',
    icon: Home,
    isCurrentPage: location.pathname === '/'
  });

  // Build path incrementally
  let currentPath = '';
  for (let i = 0; i < pathSegments.length; i++) {
    currentPath += `/${pathSegments[i]}`;
    
    // Check if this is a dynamic route (like /leads/123)
    let configKey = currentPath;
    const isDynamic = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(pathSegments[i]);
    
    if (isDynamic) {
      // Replace the ID with [id] to match config
      const pathParts = currentPath.split('/');
      pathParts[pathParts.length - 1] = '[id]';
      configKey = pathParts.join('/');
    }
    
    const config = breadcrumbConfig[configKey];
    if (config) {
      let label = config.label;
      
      // Se for rota de pipeline dinâmica, buscar nome do sessionStorage
      if (configKey === '/pipelines/[id]' && isDynamic) {
        const pipelineName = sessionStorage.getItem(`pipeline_${pathSegments[i]}_name`);
        label = pipelineName || config.label;
      }
      
      breadcrumbItems.push({
        label: config.dynamic && isDynamic && !sessionStorage.getItem(`pipeline_${pathSegments[i]}_name`) 
          ? `${label} ${pathSegments[i].slice(0, 8)}...` 
          : label,
        href: currentPath,
        icon: config.icon,
        isCurrentPage: i === pathSegments.length - 1
      });
    } else {
      // Fallback for unconfigured routes
      const label = pathSegments[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbItems.push({
        label,
        href: currentPath,
        isCurrentPage: i === pathSegments.length - 1
      });
    }
  }

  // Don't show breadcrumbs for single-level routes
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage className="flex items-center gap-1">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.href} className="flex items-center gap-1">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}