import {Component, inject, ViewChild} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SiteService} from '../../services/site-service';
import {Comparison, Filter, FilterGroup} from '../../../../shared/types/filter';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatExpansionModule, MatExpansionPanel} from '@angular/material/expansion';


@Component({
  selector: 'app-site-filter',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    MatExpansionModule
  ],
  templateUrl: './site-filter.html',
  styleUrl: './site-filter.css',
})
export class SiteFilter {
  siteService = inject(SiteService);
  @ViewChild(MatExpansionPanel) panel?: MatExpansionPanel;

  form = new FormGroup({
    name: new FormControl<string>('',
      [Validators.maxLength(100)]),
    revenueMax: new FormControl<number | null>(null,
      [Validators.min(0)]),
    revenueMin: new FormControl<number | null>(null,
      [Validators.min(0)]),
  });

  submit() {
    const v = this.form.value;
    const filters: FilterGroup = new FilterGroup();

    if (v.name) {
      const filterName = new Filter('name', v.name, Comparison.CONTAINS);
      filters.Filters.push(filterName);
    }
    if (v.revenueMin !== null && v.revenueMin !== undefined) {
      const filterRevenueMin = new Filter('revenue', v.revenueMin.toString(), Comparison.GREATER_THAN);
      filters.Filters.push(filterRevenueMin);
    }
    if (v.revenueMax !== null && v.revenueMax !== undefined) {
      const filterRevenueMax = new Filter('revenue', v.revenueMax.toString(), Comparison.LESS_THAN);
      filters.Filters.push(filterRevenueMax);
    }

    this.siteService.setFilter(filters.Filters.length ? filters : null);
    this.panel?.close();
  }

  clear(): void {
    this.form.reset({ name: '', revenueMax: null, revenueMin: null });
    this.siteService.clearFilter();
    this.panel?.close();
  }
}
