import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SeatsAeroConfig,
  SearchParameters,
  BulkAvailabilityParameters,
  LiveSearchParameters,
  SearchResponse,
  TripResponse,
  Availability,
  AvailabilityTrip,
  RouteInfo
} from './types.js';

export class SeatsAeroClient {
  private client: AxiosInstance;
  private config: SeatsAeroConfig;

  constructor(config: SeatsAeroConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://seats.aero/partnerapi',
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Partner-Authorization': this.config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 5;
          console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.client.request(error.config);
        }
        throw error;
      }
    );
  }

  async cachedSearch(params: SearchParameters): Promise<SearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.origins && params.origins.length > 0) {
        queryParams.append('origins', params.origins.join(','));
      }
      if (params.destinations && params.destinations.length > 0) {
        queryParams.append('destinations', params.destinations.join(','));
      }
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      if (params.cabin) {
        queryParams.append('cabin', params.cabin);
      }
      if (params.source) {
        queryParams.append('source', params.source);
      }
      if (params.direct !== undefined) {
        queryParams.append('direct', params.direct.toString());
      }
      if (params.minSeats !== undefined) {
        queryParams.append('minSeats', params.minSeats.toString());
      }
      if (params.maxMiles !== undefined) {
        queryParams.append('maxMiles', params.maxMiles.toString());
      }
      if (params.skip !== undefined) {
        queryParams.append('skip', params.skip.toString());
      }
      if (params.cursor) {
        queryParams.append('cursor', params.cursor);
      }

      const response = await this.client.get<any>('/search', {
        params: queryParams
      });

      const data = response.data.data || response.data;
      const availabilities = Array.isArray(data) ? data : [data];

      return {
        data: availabilities,
        cursor: response.data.cursor,
        count: availabilities.length,
        hasMore: response.data.hasMore || false
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async bulkAvailability(params: BulkAvailabilityParameters): Promise<SearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('source', params.source);
      
      if (params.origins && params.origins.length > 0) {
        queryParams.append('origins', params.origins.join(','));
      }
      if (params.destinations && params.destinations.length > 0) {
        queryParams.append('destinations', params.destinations.join(','));
      }
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      if (params.cabin) {
        queryParams.append('cabin', params.cabin);
      }
      if (params.direct !== undefined) {
        queryParams.append('direct', params.direct.toString());
      }
      if (params.skip !== undefined) {
        queryParams.append('skip', params.skip.toString());
      }
      if (params.cursor) {
        queryParams.append('cursor', params.cursor);
      }

      const response = await this.client.get<any>('/availability', {
        params: queryParams
      });

      const data = response.data.data || response.data;
      const availabilities = Array.isArray(data) ? data : [data];

      return {
        data: availabilities,
        cursor: response.data.cursor,
        count: availabilities.length,
        hasMore: response.data.hasMore || false
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getTrips(availabilityId: string): Promise<TripResponse> {
    try {
      const response = await this.client.get<any>(`/trips/${availabilityId}`);
      
      const data = response.data.data || response.data;
      const trips = Array.isArray(data) ? data : [data];

      return {
        data: trips
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getRoutes(params?: { origin?: string; destination?: string }): Promise<RouteInfo[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.origin) {
        queryParams.append('origin', params.origin);
      }
      if (params?.destination) {
        queryParams.append('destination', params.destination);
      }

      const response = await this.client.get<any>('/routes', {
        params: queryParams
      });

      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async liveSearch(params: LiveSearchParameters): Promise<AvailabilityTrip[]> {
    try {
      const response = await this.client.post<any>('/live', {
        origin: params.origin,
        destination: params.destination,
        date: params.date,
        source: params.source,
        cabin: params.cabin
      });

      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      if ((error as AxiosError).response?.status === 403) {
        throw new Error('Live Search requires a commercial agreement with Seats.aero. Pro users cannot access this endpoint.');
      }
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: any): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error(`API Error: ${axiosError.response.status} - ${axiosError.response.statusText}`);
        console.error('Response data:', axiosError.response.data);
      } else if (axiosError.request) {
        console.error('No response received from API');
      } else {
        console.error('Error setting up request:', axiosError.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }

  formatAvailability(availability: Availability): string {
    const cabins = [];
    
    if (availability.YAvailable) {
      cabins.push(`Economy: ${availability.YMileageCost || 'N/A'} miles + ${availability.YTaxes || 'N/A'} (${availability.YRemainingSeats || '?'} seats)`);
    }
    if (availability.WAvailable) {
      cabins.push(`Premium Economy: ${availability.WMileageCost || 'N/A'} miles + ${availability.WTaxes || 'N/A'} (${availability.WRemainingSeats || '?'} seats)`);
    }
    if (availability.JAvailable) {
      cabins.push(`Business: ${availability.JMileageCost || 'N/A'} miles + ${availability.JTaxes || 'N/A'} (${availability.JRemainingSeats || '?'} seats)`);
    }
    if (availability.FAvailable) {
      cabins.push(`First: ${availability.FMileageCost || 'N/A'} miles + ${availability.FTaxes || 'N/A'} (${availability.FRemainingSeats || '?'} seats)`);
    }

    return `
Route: ${availability.Route.OriginAirport} → ${availability.Route.DestinationAirport}
Date: ${availability.Date}
Source: ${availability.Route.Source}
Available Cabins:
${cabins.join('\\n')}
    `.trim();
  }

  formatTrip(trip: AvailabilityTrip): string {
    return `
Flight: ${trip.FlightNumber}
Route: ${trip.OriginAirport} → ${trip.DestinationAirport}
Departure: ${new Date(trip.DepartsAt).toLocaleString()}
Arrival: ${new Date(trip.ArrivesAt).toLocaleString()}
Aircraft: ${trip.AircraftName} (${trip.AircraftCode})
Class: ${trip.FareClass}
Cost: ${trip.MileageCost || 'N/A'} miles + ${trip.Taxes || 'N/A'}
Seats: ${trip.RemainingSeats || 'N/A'}
Distance: ${trip.Distance} miles
    `.trim();
  }
}