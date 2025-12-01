import React from 'react';
import { CRMProvider } from './CRMContext';
import { AuditProvider } from './AuditContext';

/**
 * Wrapper for pages that need CRM functionality
 * Only use this in pages that actually need pipelines, stages, and entries
 * Examples: Pipelines, Index (dashboard), Kanban views
 */
export function CRMProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <AuditProvider>
        {children}
      </AuditProvider>
    </CRMProvider>
  );
}
