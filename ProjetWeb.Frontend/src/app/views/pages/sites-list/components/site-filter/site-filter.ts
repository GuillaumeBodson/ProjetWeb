import { Component, inject, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { SiteService } from '../../services/site-service';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import {Comparison, FilterGroup, ExpressionFilter, FilterAssociation} from '../../../../../core/api/site';

function revenueRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const revenueMin = control.get('revenueMin')?.value;
    const revenueMax = control.get('revenueMax')?.value;

    if (revenueMin != null && revenueMax != null && revenueMin > revenueMax) {
      return { revenueRange: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-site-filter',
  standalone: true,
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
    name: new FormControl<string>('', [Validators.maxLength(100)]),
    revenueMax: new FormControl<number | null>(null, [Validators.min(0)]),
    revenueMin: new FormControl<number | null>(null, [Validators.min(0)]),
  }, { validators: revenueRangeValidator() });

  submit(): void {
    const v = this.form.value;
    const expressionFilters: ExpressionFilter[] = [];

    if (v.name) {
      expressionFilters.push({
        propertyName: 'name',
        valueString: v.name,
        comparison: Comparison.Contains
      });
    }

    if (v.revenueMin !== null && v.revenueMin !== undefined) {
      expressionFilters.push({
        propertyName: 'revenue',
        valueString: v.revenueMin.toString(),
        comparison: Comparison.GreaterThan
      });
    }

    if (v.revenueMax !== null && v.revenueMax !== undefined) {
      expressionFilters.push({
        propertyName: 'revenue',
        valueString: v.revenueMax.toString(),
        comparison: Comparison.LessThan
      });
    }

    const filterGroup: FilterGroup | null = expressionFilters.length > 0
      ? {
        filterAssociation: FilterAssociation.And,
        filters: expressionFilters
      }
      : null;

    this.siteService.setFilter(filterGroup);
    this.panel?.close();
  }

  clear(): void {
    this.form.reset({ name: '', revenueMax: null, revenueMin: null });
    this.siteService.clearFilter();
    this.panel?.close();
  }
}
