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