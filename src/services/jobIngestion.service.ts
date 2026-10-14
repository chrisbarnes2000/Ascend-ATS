// /src/services/jobIngestion.service.ts
import { resolveCompanyBranding } from '../utils/companyLogoResolver';

/**
 * Service helper: Returns the primary logo URL for an employer using multi-tier resolution.
 */
export async function fetchCompanyLogo(companyName: string, jobTitle?: string): Promise<string | null> {
  if (!companyName || typeof companyName !== 'string') return null;
  const branding = resolveCompanyBranding(companyName, jobTitle);
  return branding.primaryLogoUrl || null;
}
