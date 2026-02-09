import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SiteResponse as GeneratedSiteResponse} from '../api/site/model/site-response';
import { SiteDetailsResponse as GeneratedSiteDetailsResponse} from '../api/site/model/site-details-response';
import { SiteResponse, SiteDetailsResponse} from './model-override';
import {
  CreateSiteRequest,
  UpdateSiteRequest,
  PageOfOfSiteResponse,
  FilterGroup,
  SortDescriptor,
  BookTimeSlotRequest,
  TimeSlotResponse, SitesService,
} from '../api/site';

/**
 * Facade service that wraps the generated SitesService to provide
 * a cleaner, more focused API for site-related operations.
 * Follows the Single Responsibility Principle by handling business logic
 * and error handling separately from the raw API calls.
 */
@Injectable({
  providedIn: 'root'
})
export class SiteFacadeService {
  private readonly sitesService = inject(SitesService);

  /**
   * Get all sites without pagination.
   * @returns Observable of all site responses
   */
  getAllSites(): Observable<SiteResponse[]> {
    return this.sitesService.apiSitesGet().pipe(
      map(sites => sites.map(site => this.transformSite(site))),
      catchError(error => this.handleError('Failed to fetch sites', error))
    );
  }

  /**
   * Get a paginated list of sites with optional filtering and sorting.
   * @param pageNumber - The page number to retrieve (1-based)
   * @param pageSize - The number of items per page
   * @param filters - Optional filter groups to apply
   * @param sorts - Optional sort descriptors
   * @returns Observable of paginated site responses
   */
  getSitesPaginated(
    pageNumber?: number,
    pageSize?: number,
    filters?: FilterGroup[],
    sorts?: SortDescriptor[]
  ): Observable<PageOfOfSiteResponse> {
    return this.sitesService.apiSitesSearchPost({pageNumber, pageSize, filters, sorts}).pipe(
      catchError(error => this.handleError('Failed to fetch paginated sites', error))
    );
  }

  /**
   * Get a single site by ID.
   * @param id - The UUID of the site
   * @returns Observable of the site response
   */
  getSiteById(id: string): Observable<SiteDetailsResponse> {
    return this.sitesService.apiSitesIdGet(id).pipe(
      map(site => this.transformSiteDetails(site))
    );
  }

  /**
   * Create a new site.
   * @param siteData - The site creation request data
   * @returns Observable of the created site response
   */
  createSite(siteData: CreateSiteRequest): Observable<SiteDetailsResponse> {
    return this.sitesService.apiSitesPost(siteData).pipe(
      map(site => this.transformSiteDetails(site)),

      catchError(error => this.handleError('Failed to create site', error))
    );
  }

  /**
   * Update an existing site.
   * @param id - The UUID of the site to update
   * @param siteData - The site update request data
   * @returns Observable of the updated site response
   */
  updateSite(id: string, siteData: UpdateSiteRequest): Observable<SiteDetailsResponse> {
    return this.sitesService.apiSitesIdPut(id, siteData).pipe(
      map(site => this.transformSiteDetails(site)),

      catchError(error => this.handleError(`Failed to update site with ID: ${id}`, error))
    );
  }

  /**
   * Delete a site by ID.
   * @param id - The UUID of the site to delete
   * @returns Observable that completes when deletion is successful
   */
  deleteSite(id: string): Observable<void> {
    return this.sitesService.apiSitesIdDelete(id).pipe(
      map(() => void 0),
      catchError(error => this.handleError(`Failed to delete site with ID: ${id}`, error))
    );
  }

  /**
   * Book a time slot at a specific site.
   * @param siteId - The UUID of the site
   * @param bookingData - The time slot booking request data
   * @returns Observable of the booked time slot response
   */
  bookTimeSlot(siteId: string, bookingData: BookTimeSlotRequest): Observable<TimeSlotResponse> {
    return this.sitesService.apiSitesSiteIdTimeslotsBookPost(siteId, bookingData).pipe(
      catchError(error => this.handleError(`Failed to book time slot at site: ${siteId}`, error))
    );
  }

  /**
   * Centralized error handling for site operations.
   * @param message - User-friendly error message
   * @param error - The original error object
   * @returns Observable that throws an error
   */
  private handleError(message: string, error: any): Observable<never> {
    console.error(message, error);
    return throwError(() => new Error(message));
  }

  private transformSiteDetails(site: GeneratedSiteDetailsResponse): SiteDetailsResponse {
    // Validate required fields
    if (!site.id) {
      throw new Error('Site ID is required');
    }

    return {
      ...site,
      closedDays: site.closedDays?.map(d => {
        return new Date(d);
      }) ?? []
    };
  }

  private transformSite(site: GeneratedSiteResponse): SiteResponse {
    // Validate required fields
    if (!site.id) {
      throw new Error('Site ID is required');
    }

    return {
      ...site,
      closedDays: site.closedDays?.map(d => {
        return new Date(d);
      }) ?? []
    };
  }

}
