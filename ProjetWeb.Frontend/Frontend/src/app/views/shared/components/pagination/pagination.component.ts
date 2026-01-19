import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PageRequest } from '../../types/paging';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  /**
   * Total number of items in the dataset.
   * If null/undefined, the paginator will still work, but last-page behavior isn't available.
   */
  @Input({ required: false }) totalItems: number | null | undefined = 0;

  /** 0-based index coming from the container */
  @Input({ required: true }) pageIndex = 0;

  /** page size coming from the container */
  @Input({ required: true }) pageSize = 10;

  @Input({ required: false }) pageSizeOptions: readonly number[] = [10, 25, 50];
  @Input({ required: false }) disabled = false;
  @Input({ required: false }) loading = false;
  @Input({ required: false }) hidePageSize = false;
  @Input({ required: false }) showFirstLastButtons = true;

  @Output() pageChange = new EventEmitter<PageRequest>();


  protected onPage(event: PageEvent): void {
    if (this.disabled || this.loading) return;
    const pageSizeChanged = event.pageSize !== this.pageSize;
    const next: PageRequest = {
      pageIndex: pageSizeChanged ? 0 : event.pageIndex,
      pageSize: event.pageSize
    };
    this.pageChange.emit(next);
  }
}
