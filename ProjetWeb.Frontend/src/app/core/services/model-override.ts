import { SiteResponse as GeneratedSiteResponse } from '../api/site/model/site-response';
import { SiteDetailsResponse as GeneratedSiteDetailsResponse } from '../api/site/model/site-details-response';

// Override with proper Date types
export interface SiteResponse extends Omit<GeneratedSiteResponse, 'closedDays'> {
  closedDays: Date[];
}

export interface SiteDetailsResponse extends Omit<GeneratedSiteDetailsResponse, 'closedDays'> {
  closedDays: Date[];
}

// Re-export other models as-is
export * from '../api/site/model/models';
