export class Filter {
  PropertyName: string = "";
  ValueString: string = "";
  Comparison: Comparison = Comparison.EQUALS;
  FilterAssociation: FilterAssociation = FilterAssociation.AND;

  constructor(propertyName: string, valueString: string, comparison: Comparison, filterAssociation: FilterAssociation = FilterAssociation.AND) {
    this.PropertyName = propertyName;
    this.ValueString = valueString;
    this.Comparison = comparison;
    this.FilterAssociation = filterAssociation;
  }
}

export class FilterGroup {
  Filters: Filter[] = [];
  FilterAssociation: FilterAssociation = FilterAssociation.AND;
}

export enum Comparison {
  EQUALS="EQUALS",
  NOT_EQUALS="NOT_EQUALS",
  GREATER_THAN="GREATER_THAN",
  LESS_THAN="LESS_THAN",
  CONTAINS="CONTAINS"
}

export enum FilterAssociation {
  AND="AND",
  OR="OR"
}


