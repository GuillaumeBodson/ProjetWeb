import { Routes } from '@angular/router';
import { PaginationDemoComponent } from './views/pages/pagination-demo/pagination-demo.component';
import { SiteList } from "./views/pages/sites-list/components/site-list/site-list";

export const routes: Routes = [
  { path: '', component: PaginationDemoComponent },
  { path: 'sites', component: SiteList }
];
