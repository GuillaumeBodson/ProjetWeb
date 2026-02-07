import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

export interface PageRequestEvent {
  pageIndex: number;
  pageSize: number;
}

@Component({
  selector: 'app-pagination',
  imports: [CommonModule, MatPaginatorModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input({ required: false }) totalItems: number | null | undefined = 0;
  @Input({ required: true }) pageIndex = 0;
  @Input({ required: true }) pageSize = 10;
  @Input({ required: false }) pageSizeOptions: readonly number[] = [10, 25, 50];
  @Input({ required: false }) disabled = false;
  @Input({ required: false }) loading = false;
  @Input({ required: false }) hidePageSize = false;
  @Input({ required: false }) showFirstLastButtons = true;

  @Output() pageChange = new EventEmitter<PageRequestEvent>();

  protected onPage(event: PageEvent): void {
    if (this.disabled || this.loading) return;
    const pageSizeChanged = event.pageSize !== this.pageSize;
    const next: PageRequestEvent = {
      pageIndex: pageSizeChanged ? 0 : event.pageIndex,
      pageSize: event.pageSize
    };
    this.pageChange.emit(next);
  }
}
