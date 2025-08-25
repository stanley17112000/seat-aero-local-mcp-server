#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { SeatsAeroClient } from './seats-aero-client.js';
import { 
  SearchParameters, 
  BulkAvailabilityParameters,
  SUPPORTED_SOURCES,
  CABIN_NAMES,
  CabinClass
} from './types.js';

dotenv.config();

const API_KEY = process.env.SEATS_AERO_API_KEY;

if (!API_KEY) {
  console.error('Error: SEATS_AERO_API_KEY environment variable is not set');
  console.error('Please set your API key in the .env file');
  console.error('Get your API key from: https://seats.aero/apikey');
  process.exit(1);
}

const client = new SeatsAeroClient({
  apiKey: API_KEY,
  baseUrl: 'https://seats.aero/partnerapi'
});

const server = new Server(
  {
    name: 'seats-aero-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const CachedSearchSchema = z.object({
  origins: z.array(z.string()).describe('Array of origin airport codes (e.g., ["SFO", "LAX"])'),
  destinations: z.array(z.string()).describe('Array of destination airport codes'),
  startDate: z.string().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().describe('End date in YYYY-MM-DD format'),
  cabin: z.enum(['Y', 'W', 'J', 'F']).optional().describe('Cabin class: Y=Economy, W=Premium Economy, J=Business, F=First'),
  source: z.string().optional().describe('Specific mileage program (e.g., "aeroplan", "delta")'),
  direct: z.boolean().optional().describe('Only show direct flights'),
  minSeats: z.number().optional().describe('Minimum number of available seats'),
  maxMiles: z.number().optional().describe('Maximum miles cost')
});

const BulkAvailabilitySchema = z.object({
  source: z.string().describe('Mileage program to search (e.g., "delta", "united")'),
  origins: z.array(z.string()).optional().describe('Array of origin airport codes'),
  destinations: z.array(z.string()).optional().describe('Array of destination airport codes'),
  startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
  cabin: z.enum(['Y', 'W', 'J', 'F']).optional().describe('Cabin class'),
  direct: z.boolean().optional().describe('Only show direct flights')
});

const GetTripsSchema = z.object({
  availabilityId: z.string().describe('The availability ID from a search result')
});

const GetRoutesSchema = z.object({
  origin: z.string().optional().describe('Origin airport code'),
  destination: z.string().optional().describe('Destination airport code')
});

const tools: ToolSchema[] = [
  {
    name: 'search_award_availability',
    description: 'Search for award availability across multiple mileage programs. Best for specific route and date searches.',
    inputSchema: {
      type: 'object',
      properties: {
        origins: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of origin airport codes (e.g., ["SFO", "LAX"])'
        },
        destinations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of destination airport codes'
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        },
        cabin: {
          type: 'string',
          enum: ['Y', 'W', 'J', 'F'],
          description: 'Cabin class: Y=Economy, W=Premium Economy, J=Business, F=First'
        },
        source: {
          type: 'string',
          description: `Specific mileage program. Options: ${SUPPORTED_SOURCES.join(', ')}`
        },
        direct: {
          type: 'boolean',
          description: 'Only show direct flights'
        },
        minSeats: {
          type: 'number',
          description: 'Minimum number of available seats'
        },
        maxMiles: {
          type: 'number',
          description: 'Maximum miles cost'
        }
      },
      required: ['origins', 'destinations', 'startDate', 'endDate']
    }
  },
  {
    name: 'bulk_availability',
    description: 'Get bulk availability data for a specific mileage program. Best for broad searches across regions.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: `Mileage program. Options: ${SUPPORTED_SOURCES.join(', ')}`
        },
        origins: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of origin airport codes'
        },
        destinations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of destination airport codes'
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        },
        cabin: {
          type: 'string',
          enum: ['Y', 'W', 'J', 'F'],
          description: 'Cabin class'
        },
        direct: {
          type: 'boolean',
          description: 'Only show direct flights'
        }
      },
      required: ['source']
    }
  },
  {
    name: 'get_flight_details',
    description: 'Get detailed flight information for a specific availability result',
    inputSchema: {
      type: 'object',
      properties: {
        availabilityId: {
          type: 'string',
          description: 'The availability ID from a search result'
        }
      },
      required: ['availabilityId']
    }
  },
  {
    name: 'get_routes',
    description: 'Get available routes and mileage programs between airports',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin airport code'
        },
        destination: {
          type: 'string',
          description: 'Destination airport code'
        }
      }
    }
  },
  {
    name: 'list_mileage_programs',
    description: 'List all supported mileage programs',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_award_availability': {
        const params = CachedSearchSchema.parse(args);
        const searchParams: SearchParameters = {
          origins: params.origins,
          destinations: params.destinations,
          startDate: params.startDate,
          endDate: params.endDate,
          cabin: params.cabin as CabinClass | undefined,
          source: params.source,
          direct: params.direct,
          minSeats: params.minSeats,
          maxMiles: params.maxMiles
        };

        const response = await client.cachedSearch(searchParams);
        
        if (response.data.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No availability found for the specified search criteria.'
              }
            ]
          };
        }

        const results = response.data.slice(0, 10).map(avail => 
          client.formatAvailability(avail)
        ).join('\\n\\n---\\n\\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${response.count} results. Showing first ${Math.min(10, response.count)}:\\n\\n${results}`
            }
          ]
        };
      }

      case 'bulk_availability': {
        const params = BulkAvailabilitySchema.parse(args);
        const bulkParams: BulkAvailabilityParameters = {
          source: params.source,
          origins: params.origins,
          destinations: params.destinations,
          startDate: params.startDate,
          endDate: params.endDate,
          cabin: params.cabin as CabinClass | undefined,
          direct: params.direct
        };

        const response = await client.bulkAvailability(bulkParams);
        
        if (response.data.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No availability found for ${params.source}.`
              }
            ]
          };
        }

        const results = response.data.slice(0, 10).map(avail => 
          client.formatAvailability(avail)
        ).join('\\n\\n---\\n\\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${response.count} results for ${params.source}. Showing first ${Math.min(10, response.count)}:\\n\\n${results}`
            }
          ]
        };
      }

      case 'get_flight_details': {
        const params = GetTripsSchema.parse(args);
        const response = await client.getTrips(params.availabilityId);
        
        if (response.data.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No flight details found for this availability ID.'
              }
            ]
          };
        }

        const flights = response.data.map(trip => 
          client.formatTrip(trip)
        ).join('\\n\\n---\\n\\n');

        return {
          content: [
            {
              type: 'text',
              text: `Flight Details:\\n\\n${flights}`
            }
          ]
        };
      }

      case 'get_routes': {
        const params = GetRoutesSchema.parse(args);
        const routes = await client.getRoutes(params);
        
        if (routes.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No routes found.'
              }
            ]
          };
        }

        const routeInfo = routes.map(route => 
          `${route.origin} → ${route.destination}: ${route.sources.join(', ')}`
        ).join('\\n');

        return {
          content: [
            {
              type: 'text',
              text: `Available Routes:\\n${routeInfo}`
            }
          ]
        };
      }

      case 'list_mileage_programs': {
        const programs = SUPPORTED_SOURCES.map(source => 
          `• ${source}`
        ).join('\\n');

        return {
          content: [
            {
              type: 'text',
              text: `Supported Mileage Programs:\\n${programs}\\n\\nCabin Classes:\\n${Object.entries(CABIN_NAMES).map(([code, name]) => `• ${code} = ${name}`).join('\\n')}`
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`
        }
      ]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Seats.aero MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});