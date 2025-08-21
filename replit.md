# BART Commute App

## Project Overview
A smart BART commute app that optimizes routes to Dublin/Pleasanton by comparing direct vs. reverse-route options from Embarcadero station.

## Features
- Shows next trains to Dublin/Pleasanton from Embarcadero station
- Real-time BART API integration
- Mobile-friendly responsive design
- Fast loading times
- Clean, focused UI for commuters

## Architecture
- Frontend: React with TypeScript, Tailwind CSS, shadcn/ui
- Backend: Express.js with TypeScript
- Data: BART Legacy API for real-time train data
- Storage: In-memory (no persistence needed for real-time data)

## API Integration
- BART Legacy API endpoint: `http://api.bart.gov/api/etd.aspx`
- Public API key: `MW9S-E7SL-26DU-VV8V`
- Station codes: EMBR (Embarcadero)
- Target destinations: Dublin/Pleasanton line trains

## User Preferences
- Mobile-first design prioritized
- Fast loading performance required
- Simple, focused interface for daily commute use

## Recent Changes
- Initial project setup and planning (2025-08-20)
- Removed complex routing logic per user feedback to focus on core functionality
- Added departure times to all train displays and route recommendations (2025-08-20)
- Created sidebar with trains categorized by direction: "→ SF City" and "← Away from SF" (2025-08-20)
- Implemented responsive layout with desktop sidebar and mobile-first design
- **MAJOR FIX**: Fixed transfer route optimization logic to properly find reverse-direction routes (2025-08-20)
  - Routes now correctly compare direct vs transfer options across Montgomery, Powell, Civic Center, 16th St, and 24th St
  - Transfer logic now finds Dublin trains departing AFTER transfer completion time
  - App successfully recommends faster transfer routes when available
- Updated UI to show ETA at Dublin/Pleasanton instead of time saved for clearer trip planning
- **CONSISTENCY UPDATE**: Standardized time display order across all components (2025-08-21)
  - TrainCard: Now shows ETA Dublin, time remaining, then actual departure time
  - RouteTimeline: Shows time remaining, then actual time consistently
  - Sidebar trains: Shows time remaining, then actual time
  - Fixed TypeScript types to include missing RouteStep properties (departureTime, arrivalTime, transferTime)
- **TRAVEL TIME SLIDER**: Added dynamic travel time configuration (2025-08-21)
  - 1-10 minute slider for time to reach Embarcadero station
  - Pre-calculated route recommendations for all travel time values
  - Instant updates when slider moves - no API delays
  - Enhanced slider UI with visual tick marks and smooth animations
- **API OPTIMIZATION**: Reduced BART API load with 15-second caching (2025-08-21)
  - Reduced cache TTL from 30 seconds to 15 seconds
  - Updated frontend refresh intervals to match cache duration
  - More frequent updates while being respectful to BART API servers