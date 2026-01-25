import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SiteService } from "../../services/site-service";
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { AsyncPipe } from '@angular/common';
import { Site } from '../../types/site';
import { map } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import {SiteFilter} from '../site-filter/site-filter';
import { MatButtonModule } from '@angular/material/button';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-site-list',
  imports: [
    PaginationComponent,
    AsyncPipe,
    MatTableModule,
    SiteFilter,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './site-list.html',
  styleUrl: './site-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SiteList {
  loading = signal(false);
  readonly siteService = inject(SiteService);
  readonly items$ = this.siteService.page$.pipe(map(page => page.items as Site[]));

  readonly displayedColumns = ['name', 'courts', 'revenue', 'actions']
}
