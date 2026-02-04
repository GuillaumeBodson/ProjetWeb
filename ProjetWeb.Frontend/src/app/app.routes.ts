import { Routes } from '@angular/router';
import { PaginationDemoComponent } from './views/pages/pagination-demo/pagination-demo.component';
import { SiteList } from "./views/pages/sites-list/components/site-list/site-list";
import { SiteDetails } from "./views/pages/site-details/components/site-details/site-details";
import {SignIn} from './views/pages/sign-in/sign-in/sign-in';

export const routes: Routes = [
  { path: '', component: PaginationDemoComponent },
  { path: 'dashboard', component: PaginationDemoComponent },
  { path: 'sign', component: SignIn },
  { path: 'sites', component: SiteList },
  { path: 'sites/:id', component: SiteDetails }
];
