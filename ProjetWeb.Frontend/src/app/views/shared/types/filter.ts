export interface Filter {
  propertyName: string;
  valueString: string;
  comparison: Comparison;
  filterAssociation?: FilterAssociation;
}

export interface FilterGroup {
  filters: Filter[];
  filterAssociation?: FilterAssociation;
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


