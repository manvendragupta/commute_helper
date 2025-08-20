import { apiRequest } from "./queryClient";
import type { BartStationData, RouteRecommendation, ProcessedTrain } from "../types/bart";

export async function fetchStationData(stationCode: string): Promise<BartStationData> {
  const response = await apiRequest('GET', `/api/bart/station/${stationCode}`);
  return response.json();
}

export async function fetchRouteRecommendation(): Promise<RouteRecommendation> {
  const response = await apiRequest('GET', '/api/bart/route-recommendation');
  return response.json();
}

export function processBartTrains(stationData: BartStationData, targetDestinations: string[] = ['Dublin', 'Pleasanton']): ProcessedTrain[] {
  if (!stationData.etd) return [];

  const trains: ProcessedTrain[] = [];

  stationData.etd.forEach(destination => {
    const isTarget = targetDestinations.some(target => 
      destination.destination.includes(target)
    );

    if (!isTarget) return;

    destination.estimate.forEach(estimate => {
      const minutes = parseInt(estimate.minutes) || 0;
      const cars = parseInt(estimate.length) || 10;
      const delay = estimate.delay ? parseInt(estimate.delay) : 0;

      trains.push({
        destination: destination.destination,
        minutes,
        platform: estimate.platform || '1',
        cars,
        color: estimate.color || 'BLUE',
        delay,
        status: delay > 1 ? 'delayed' : 'on-time'
      });
    });
  });

  return trains.sort((a, b) => a.minutes - b.minutes);
}

export function getBartLineColor(color: string): string {
  const colorMap: Record<string, string> = {
    'BLUE': 'bg-bart-blue',
    'ORANGE': 'bg-bart-orange', 
    'RED': 'bg-bart-red',
    'YELLOW': 'bg-bart-yellow',
    'GREEN': 'bg-bart-green'
  };
  return colorMap[color] || 'bg-bart-blue';
}

export function calculateDepartureTime(minutes: number): string {
  if (minutes === 0) return 'Leaving';
  
  const now = new Date();
  const departure = new Date(now.getTime() + minutes * 60000);
  
  return departure.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Los_Angeles'
  });
}

export function processAllTrains(stationData: BartStationData): { 
  dublinTrains: ProcessedTrain[];
  towardsSFTrains: ProcessedTrain[];
  awayFromSFTrains: ProcessedTrain[];
} {
  if (!stationData.etd) return { dublinTrains: [], towardsSFTrains: [], awayFromSFTrains: [] };

  const dublinTrains: ProcessedTrain[] = [];
  const towardsSFTrains: ProcessedTrain[] = [];
  const awayFromSFTrains: ProcessedTrain[] = [];

  // Destinations heading towards SF city center
  const towardsSFDestinations = ['Montgomery', 'Powell', 'Civic Center', '16th St Mission', '24th St Mission', 'Glen Park'];
  
  // Destinations heading away from SF city
  const awayFromSFDestinations = ['Daly City', 'Colma', 'South San Francisco', 'San Bruno', 'Millbrae', 'SFO', 'Richmond', 'El Cerrito del Norte', 'El Cerrito Plaza', 'North Berkeley', 'Berkeley', 'Ashby', 'MacArthur', 'Rockridge', 'Orinda', 'Lafayette', 'Walnut Creek', 'Pleasant Hill', 'Concord', 'North Concord', 'Pittsburg', 'Antioch'];

  stationData.etd.forEach(destination => {
    const isDublinPleasanton = ['Dublin', 'Pleasanton'].some(target => 
      destination.destination.includes(target)
    );

    destination.estimate.forEach(estimate => {
      const minutes = parseInt(estimate.minutes) || 0;
      const cars = parseInt(estimate.length) || 10;
      const delay = estimate.delay ? parseInt(estimate.delay) : 0;

      const train: ProcessedTrain = {
        destination: destination.destination,
        minutes,
        platform: estimate.platform || '1',
        cars,
        color: estimate.color || 'BLUE',
        delay,
        status: delay > 1 ? 'delayed' : 'on-time'
      };

      if (isDublinPleasanton) {
        dublinTrains.push(train);
      } else {
        const isTowardsSF = towardsSFDestinations.some(sfDest => 
          destination.destination.includes(sfDest)
        );
        
        if (isTowardsSF) {
          towardsSFTrains.push(train);
        } else {
          awayFromSFTrains.push(train);
        }
      }
    });
  });

  return {
    dublinTrains: dublinTrains.sort((a, b) => a.minutes - b.minutes),
    towardsSFTrains: towardsSFTrains.sort((a, b) => a.minutes - b.minutes),
    awayFromSFTrains: awayFromSFTrains.sort((a, b) => a.minutes - b.minutes)
  };
}
