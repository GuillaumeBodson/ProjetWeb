export interface Court {
  id: number;
  number: number;
}

export interface Booking{
  id: number;
  courtId: number;
  siteId: number;
  startTime: Date;
  endTime: Date;
}
