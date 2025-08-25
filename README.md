# Seats.aero MCP Server

A Model Context Protocol (MCP) server that provides tools for searching award flight availability using the Seats.aero API. This server helps you plan travel using points redemption across 20+ airline loyalty programs.

## Features

- **Search Award Availability**: Search for award flights across multiple dates and mileage programs
- **Bulk Availability**: Get comprehensive availability data for specific mileage programs
- **Flight Details**: Retrieve detailed flight information including aircraft, times, and seat availability
- **Route Information**: Discover available routes between airports
- **Multi-Program Support**: Access data from 20+ airline loyalty programs including:
  - Star Alliance (United, Aeroplan, Singapore, Turkish, etc.)
  - OneWorld (American, British Airways, Qantas, Qatar, etc.)
  - SkyTeam (Delta, Flying Blue, Korean, etc.)
  - Other partners (Alaska, Emirates, Southwest, etc.)

## Prerequisites

- Node.js 18+ installed
- A Seats.aero Pro account (free tier available)
- Claude Desktop or another MCP-compatible client

## Installation

1. **Clone this repository:**
   ```bash
   git clone <repository-url>
   cd seats-aero-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

## API Key Setup

1. **Get your Seats.aero API key:**
   - Sign up for a free Seats.aero Pro account at [seats.aero](https://seats.aero)
   - Generate your personal API key at [seats.aero/apikey](https://seats.aero/apikey)
   - Pro users get 1,000 free API calls per day

2. **Configure your API key:**
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your API key:
   ```
   SEATS_AERO_API_KEY=your_actual_api_key_here
   ```

   **Important:** Keep your API key secure and never commit it to version control!

## Claude Desktop Configuration

Add this server to your Claude Desktop configuration:

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "seats-aero": {
      "command": "node",
      "args": ["/absolute/path/to/seats-aero-mcp-server/dist/index.js"],
      "env": {
        "SEATS_AERO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Windows
Edit `%APPDATA%\\Claude\\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "seats-aero": {
      "command": "node",
      "args": ["C:\\\\absolute\\\\path\\\\to\\\\seats-aero-mcp-server\\\\dist\\\\index.js"],
      "env": {
        "SEATS_AERO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Note:** Replace `/absolute/path/to/seats-aero-mcp-server` with the actual path where you cloned this repository.

## Available Tools

Once configured, you can use these tools in Claude Desktop:

### 1. `search_award_availability`
Search for award availability across multiple airports and dates.

**Parameters:**
- `origins`: Array of origin airport codes (e.g., ["SFO", "LAX"])
- `destinations`: Array of destination airport codes
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `cabin`: Optional cabin class (Y=Economy, W=Premium Economy, J=Business, F=First)
- `source`: Optional specific mileage program
- `direct`: Optional boolean for direct flights only
- `minSeats`: Optional minimum available seats
- `maxMiles`: Optional maximum miles cost

**Example:** "Search for business class awards from SFO or LAX to Tokyo in March 2025"

### 2. `bulk_availability`
Get bulk availability data for a specific mileage program.

**Parameters:**
- `source`: Mileage program (required)
- `origins`: Optional array of origin airports
- `destinations`: Optional array of destination airports
- `startDate`: Optional start date
- `endDate`: Optional end date
- `cabin`: Optional cabin class
- `direct`: Optional direct flights only

**Example:** "Show me all Delta SkyMiles availability from US to Europe"

### 3. `get_flight_details`
Get detailed flight information for a specific availability.

**Parameters:**
- `availabilityId`: The ID from a search result

**Example:** "Get flight details for availability ID abc123"

### 4. `get_routes`
Discover available routes between airports.

**Parameters:**
- `origin`: Optional origin airport
- `destination`: Optional destination airport

**Example:** "What routes are available from SFO?"

### 5. `list_mileage_programs`
List all supported mileage programs.

**Example:** "List all supported airline programs"

## Usage Examples in Claude

Once configured, you can ask Claude questions like:

- "Find me business class award flights from San Francisco to Tokyo in March 2025"
- "Search for premium economy awards from NYC to London using British Airways Avios"
- "What's the availability for Delta SkyMiles from LAX to Paris?"
- "Show me all available routes from Chicago"
- "Find the cheapest award flights from Boston to Hawaii in summer 2025"

## Supported Mileage Programs

- **Star Alliance**: Aeroplan, Avianca, Singapore, Turkish, United
- **OneWorld**: Alaska, American, British Airways, Cathay, Iberia, Qantas, Qatar
- **SkyTeam**: Aeromexico, Delta, Flying Blue, Korean
- **Others**: Emirates, Etihad, Frontier, JetBlue, Southwest, Velocity, Virgin

## Troubleshooting

### API Key Issues
- Ensure your API key is correctly set in the `.env` file or Claude Desktop config
- Verify your API key is active at [seats.aero/apikey](https://seats.aero/apikey)
- Check you haven't exceeded the daily API limit (1,000 calls for Pro users)

### Connection Issues
- Verify the server is built: `npm run build`
- Check the path in Claude Desktop config is absolute and correct
- Ensure Node.js is installed and accessible

### No Results
- Some routes may not have award availability
- Try broader date ranges or multiple airports
- Check if the mileage program covers your desired route

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Rate Limits

- Pro users: 1,000 API calls per day
- The server automatically handles rate limiting and retries
- Consider caching frequent searches locally

## Security Notes

- Never share your API key publicly
- Add `.env` to your `.gitignore` file
- Use environment variables for production deployments
- API keys are personal and non-transferable per Seats.aero terms

## Support

- For API issues: Contact Seats.aero support
- For MCP server issues: Open an issue in this repository
- For commercial use: Contact business@seats.aero

## License

MIT

## Disclaimer

This is an unofficial MCP server for Seats.aero. It is not affiliated with or endorsed by Seats.aero. Use of the Seats.aero API is subject to their terms of service.