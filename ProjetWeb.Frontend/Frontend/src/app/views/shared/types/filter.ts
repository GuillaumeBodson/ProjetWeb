export interface Filter {
  PropertyName: string;
  ValueString: string;
  Comparison: Comparison;
  FilterAssociation: FilterAssociation;
}

export interface FilterGroup {
  Filters: Filter[];
  FilterAssociation: FilterAssociation;
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


