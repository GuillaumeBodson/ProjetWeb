import { Component, inject, signal } from '@angular/core';
import { SiteService } from "../../services/site-service";
import {PaginationComponent} from '../../../../shared/components/pagination/pagination.component';
import {AsyncPipe} from '@angular/common';
import {Site} from '../../types/site';
import {map} from 'rxjs/operators';
import {MatListModule} from '@angular/material/list';
import {MatTableModule} from '@angular/material/table';

@Component({
  selector: 'app-site-list',
  imports: [
    PaginationComponent,
    AsyncPipe,
    MatListModule,
    MatTableModule
  ],
  templateUrl: './site-list.html',
  styleUrl: './site-list.css',
})

export class SiteList {
  loading = signal(false);
  readonly siteService = inject(SiteService);
  readonly items$ = this.siteService.page$.pipe(map(page => page.items as Site[]));
  protected readonly Site = Site;
}
