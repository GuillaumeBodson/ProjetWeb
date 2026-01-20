export class Site {
  id!: number;
  name!: string;
  openingHours!: string;
  closingHours!: string;
  closedDays!: string[];
  courts!: string[];
  revenue!: number;
}

export type SiteDto = Site;
