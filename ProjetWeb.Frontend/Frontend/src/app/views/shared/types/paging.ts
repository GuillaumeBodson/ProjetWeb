
/**
 * Generic request shape for server-side paging.
 * - pageIndex is 0-based
 * - pageSize must be > 0
 */
export interface PageRequest {
  pageIndex: number;
  pageSize: number;
}

/**
 * Generic response shape for server-side paged endpoints.
 */
export interface PageResponse<T> {
  items: T[];
  totalItems: number;
  pageIndex: number;
  pageSize: number;
}
