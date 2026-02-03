import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {BASE_PATH, provideApi} from './core/api/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),

    provideApi('http://localhost:5134'),
    //{ provide: BASE_PATH, useValue: 'https://localhost:7000/auth' }
  ]
};
