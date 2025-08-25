export interface SeatsAeroConfig {
  apiKey: string;
  baseUrl: string;
  maxRetries?: number;
  timeout?: number;
}

export interface Route {
  OriginAirport: string;
  DestinationAirport: string;
  Source: string;
}

export interface Availability {
  ID: string;
  Route: Route;
  Date: string;
  YAvailable?: boolean;
  YDirect?: boolean;
  YMileageCost?: string;
  YRemainingSeats?: number;
  YTaxes?: string;
  WAvailable?: boolean;
  WDirect?: boolean;
  WMileageCost?: string;
  WRemainingSeats?: number;
  WTaxes?: string;
  JAvailable?: boolean;
  JDirect?: boolean;
  JMileageCost?: string;
  JRemainingSeats?: number;
  JTaxes?: string;
  FAvailable?: boolean;
  FDirect?: boolean;
  FMileageCost?: string;
  FRemainingSeats?: number;
  FTaxes?: string;
}

export interface AvailabilityTrip {
  ID: string;
  RouteID: string;
  AvailabilityID: string;
  FlightNumber: string;
  Distance: number;
  FareClass: string;
  AircraftName: string;
  AircraftCode: string;
  OriginAirport: string;
  DestinationAirport: string;
  DepartsAt: string;
  ArrivesAt: string;
  Source: string;
  Order: number;
  MileageCost?: string;
  Taxes?: string;
  RemainingSeats?: number;
}

export interface SearchParameters {
  origins: string[];
  destinations: string[];
  startDate: string;
  endDate: string;
  cabin?: 'Y' | 'W' | 'J' | 'F';
  source?: string;
  direct?: boolean;
  minSeats?: number;
  maxMiles?: number;
  skip?: number;
  cursor?: string;
}

export interface BulkAvailabilityParameters {
  source: string;
  origins?: string[];
  destinations?: string[];
  startDate?: string;
  endDate?: string;
  cabin?: 'Y' | 'W' | 'J' | 'F';
  direct?: boolean;
  skip?: number;
  cursor?: string;
}

export interface LiveSearchParameters {
  origin: string;
  destination: string;
  date: string;
  source: string;
  cabin?: 'Y' | 'W' | 'J' | 'F';
}

export interface SearchResponse {
  data: Availability[];
  cursor?: string;
  count: number;
  hasMore: boolean;
}

export interface TripResponse {
  data: AvailabilityTrip[];
}

export interface RouteInfo {
  origin: string;
  destination: string;
  sources: string[];
  distance?: number;
}

export type CabinClass = 'Y' | 'W' | 'J' | 'F';

export const CABIN_NAMES: Record<CabinClass, string> = {
  'Y': 'Economy',
  'W': 'Premium Economy',
  'J': 'Business',
  'F': 'First'
};

export const SUPPORTED_SOURCES = [
  'aeroplan',
  'aeromexico',
  'alaska',
  'american',
  'avianca',
  'britishairways',
  'cathay',
  'delta',
  'emirates',
  'etihad',
  'flyingblue',
  'frontier',
  'iberia',
  'jetblue',
  'korean',
  'lifemiles',
  'qantas',
  'qatar',
  'sas',
  'singapore',
  'southwest',
  'turkish',
  'united',
  'velocity',
  'virgin'
] as const;

export type SupportedSource = typeof SUPPORTED_SOURCES[number];