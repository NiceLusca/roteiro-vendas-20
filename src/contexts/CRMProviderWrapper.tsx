import React from 'react';
import { CRMProvider } from './CRMContext';
import { AuditProvider } from './AuditContext';
import { AllLogsAuditProvider } from './AllLogsAuditContext';

/**
 * Wrapper for pages that need CRM functionality
 * Only use this in pages that actually need pipelines, stages, and entries
 * Examples: Pipelines, Index (dashboard), Kanban views
 */
export function CRMProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <AuditProvider>
        <AllLogsAuditProvider>
          {children}
        </AllLogsAuditProvider>
      </AuditProvider>
    </CRMProvider>
  );
}
