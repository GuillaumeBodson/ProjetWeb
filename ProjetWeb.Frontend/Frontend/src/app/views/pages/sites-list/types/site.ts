export class Site {
  id!: number;
  name!: string;
  openingHours!: string;
  closingHours!: string;
  closedDays!: string[];
  courts!: string[];
}

export type SiteDto = Site;
