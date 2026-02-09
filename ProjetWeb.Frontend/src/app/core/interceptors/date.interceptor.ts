import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

/**
 * ISO 8601 date string regex (matches YYYY-MM-DD or full ISO datetime)
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Recursively converts ISO date strings to Date objects
 */
function convertDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertDates(item));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];

      // Convert ISO date strings to Date objects
      if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
        converted[key] = new Date(value);
      } else {
        converted[key] = convertDates(value);
      }
    }
    return converted;
  }

  return obj;
}

/**
 * HTTP Interceptor that automatically converts ISO date strings to Date objects
 * in HTTP responses from the API.
 */
export const dateInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.body) {
        // Only process JSON responses
        const contentType = event.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Mutate the body to convert date strings
          (event as any).body = convertDates(event.body);
        }
      }
    })
  );
};
