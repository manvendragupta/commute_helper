import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { bartStationDataSchema, routeRecommendationSchema, type BartStationData, type RouteRecommendation } from "@shared/schema";
import axios from "axios";

const BART_API_KEY = 'MW9S-E7SL-26DU-VV8V';
const BART_API_BASE = 'http://api.bart.gov/api/etd.aspx';

const STATION_CODES = {
  EMBR: 'Embarcadero',
  MONT: 'Montgomery',
  POWL: 'Powell',
  CIVC: 'Civic Center',
  '16TH': '16th St Mission',
  '24TH': '24th St Mission'
};

const TRAVEL_TIMES = {
  'EMBR-MONT': 1,
  'MONT-POWL': 1, 
  'POWL-CIVC': 2,
  'CIVC-16TH': 3,
  '16TH-24TH': 2
};

const TRANSFER_BUFFER = 2; // 2 minute buffer for transfers
const COMMUTE_TO_STATION_TIME = 9; // 9 minutes from desk to Embarcadero platform
const EMBR_TO_DUBLIN_TRAVEL_TIME = 45; // Approximate travel time from Embarcadero to Dublin/Pleasanton

// Helper function to calculate departure time
function calculateDepartureTime(minutes: number): string {
  const now = new Date();
  const departureTime = new Date(now.getTime() + minutes * 60 * 1000);
  return departureTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Los_Angeles'
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get real-time data for a specific station
  app.get("/api/bart/station/:code", async (req, res) => {
    try {
      const stationCode = req.params.code.toUpperCase();
      
      if (!Object.keys(STATION_CODES).includes(stationCode)) {
        return res.status(400).json({ error: "Invalid station code" });
      }

      // Check cache first
      const cachedData = await storage.getCachedStationData(stationCode);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Fetch from BART API
      const response = await axios.get(BART_API_BASE, {
        params: {
          cmd: 'etd',
          orig: stationCode,
          key: BART_API_KEY,
          json: 'y'
        }
      });

      const rawData = response.data;
      
      if (!rawData.root || !rawData.root.station || rawData.root.station.length === 0) {
        return res.status(503).json({ error: "No data available from BART API" });
      }

      const stationData: BartStationData = {
        station: rawData.root.station[0].name,
        abbreviation: rawData.root.station[0].abbr,
        etd: rawData.root.station[0].etd || []
      };

      // Cache the data
      await storage.cacheStationData(stationCode, stationData);
      
      res.json(stationData);
    } catch (error) {
      console.error('Error fetching BART station data:', error);
      res.status(500).json({ error: "Failed to fetch station data" });
    }
  });

  // Get optimized route recommendation
  app.get("/api/bart/route-recommendation/:travelTime?", async (req, res) => {
    try {
      // Get travel time from params or use default
      const travelTimeToEmbarcadero = parseInt(req.params.travelTime || '') || COMMUTE_TO_STATION_TIME;
      
      // Check cache first
      const cachedRecommendation = await storage.getCachedRouteRecommendation();
      if (cachedRecommendation) {
        return res.json(cachedRecommendation);
      }

      // Fetch data for all stations
      const stations = ['EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH'];
      // console.log('Fetching station data for:', stations);
      const stationPromises = stations.map(async (code) => {
        try {
          const response = await axios.get(BART_API_BASE, {
            params: {
              cmd: 'etd',
              orig: code,
              key: BART_API_KEY,
              json: 'y'
            }
          });
          
          const rawData = response.data;
          if (!rawData.root || !rawData.root.station || rawData.root.station.length === 0) {
            return { code, data: null };
          }

          return {
            code,
            data: {
              station: rawData.root.station[0].name,
              abbreviation: rawData.root.station[0].abbr,
              etd: rawData.root.station[0].etd || []
            }
          };
        } catch (error) {
          console.error(`Error fetching data for ${code}:`, error);
          return { code, data: null };
        }
      });

      const stationResults = await Promise.all(stationPromises);
      const stationData: Record<string, BartStationData | null> = {};
      
      stationResults.forEach(result => {
        stationData[result.code] = result.data;
      });


      
      // Calculate optimal route
      const recommendation = calculateOptimalRoute(stationData, travelTimeToEmbarcadero);
      
      // Cache the recommendation
      await storage.cacheRouteRecommendation(recommendation);
      
      res.json(recommendation);
    } catch (error) {
      console.error('Error calculating route recommendation:', error);
      res.status(500).json({ error: "Failed to calculate route recommendation" });
    }
  });

  // Get all pre-calculated route recommendations for all travel times (1-10 minutes)
  app.get("/api/bart/route-recommendations-all", async (req, res) => {
    try {
      // Check cache first
      const cachedAllRecommendations = await storage.getCachedAllRouteRecommendations();
      if (cachedAllRecommendations) {
        return res.json(cachedAllRecommendations);
      }

      // Fetch data for all stations
      const stations = ['EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH'];
      const stationPromises = stations.map(async (code) => {
        try {
          const response = await axios.get(BART_API_BASE, {
            params: {
              cmd: 'etd',
              orig: code,
              key: BART_API_KEY,
              json: 'y'
            }
          });
          
          const rawData = response.data;
          if (!rawData.root || !rawData.root.station || rawData.root.station.length === 0) {
            return { code, data: null };
          }

          return {
            code,
            data: {
              station: rawData.root.station[0].name,
              abbreviation: rawData.root.station[0].abbr,
              etd: rawData.root.station[0].etd || []
            }
          };
        } catch (error) {
          console.error(`Error fetching data for ${code}:`, error);
          return { code, data: null };
        }
      });

      const stationResults = await Promise.all(stationPromises);
      const stationData: Record<string, BartStationData | null> = {};
      
      stationResults.forEach(result => {
        stationData[result.code] = result.data;
      });

      // Calculate recommendations for all travel times (1-10 minutes)
      const allRecommendations: Record<string, RouteRecommendation> = {};
      for (let travelTime = 1; travelTime <= 10; travelTime++) {
        allRecommendations[travelTime.toString()] = calculateOptimalRoute(stationData, travelTime);
      }
      
      // Cache all recommendations
      await storage.cacheAllRouteRecommendations(allRecommendations);
      
      res.json(allRecommendations);
    } catch (error) {
      console.error('Error calculating all route recommendations:', error);
      res.status(500).json({ error: "Failed to calculate route recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateOptimalRoute(stationData: Record<string, BartStationData | null>, travelTimeToEmbarcadero: number = COMMUTE_TO_STATION_TIME): RouteRecommendation {
  const embarcaderoData = stationData.EMBR;
  
  if (!embarcaderoData) {
    return {
      type: 'direct',
      totalTime: 999,
      steps: [{ action: 'Error: Unable to fetch train data', station: 'Embarcadero' }]
    };
  }

  // Find Dublin/Pleasanton trains at Embarcadero (only those departing more than 9 minutes from now)
  const dublinTrains = embarcaderoData.etd
    .filter(etd => etd.destination.includes('Dublin') || etd.destination.includes('Pleasanton'))
    .flatMap(etd => etd.estimate.map(est => ({
      destination: etd.destination,
      minutes: parseInt(est.minutes) || 999,
      platform: est.platform || '1'
    })))
    .filter(train => train.minutes > travelTimeToEmbarcadero)
    .sort((a, b) => a.minutes - b.minutes);

  const nextDublinTrain = dublinTrains[0];
  
  if (!nextDublinTrain) {
    return {
      type: 'direct',
      totalTime: 999,
      steps: [{ action: `No Dublin/Pleasanton trains departing more than ${travelTimeToEmbarcadero} minutes from now`, station: 'Embarcadero' }]
    };
  }

  // Find reverse direction trains (towards Daly City/Millbrae) - include all trains, filter later based on 9-min rule
  const reverseTrains = embarcaderoData.etd
    .filter(etd => etd.destination.includes('Daly') || etd.destination.includes('Millbrae') || 
                   etd.destination.includes('Richmond') || etd.destination.includes('Fremont'))
    .flatMap(etd => etd.estimate.map(est => ({
      destination: etd.destination,
      minutes: parseInt(est.minutes) || 999,
      platform: est.platform || '2'
    })))
    .sort((a, b) => a.minutes - b.minutes);

  // Check transfer options at other stations
  const transferOptions: Array<{
    station: string;
    code: string;
    totalTime: number;
    reverseTrainTime: number;
    dublinTrainTime: number;
    arrivalTimeAtStation: number;
    travelTime: number;
  }> = [];

  const transferStations = [
    { code: 'MONT', name: 'Montgomery', travelTime: 1 },
    { code: 'POWL', name: 'Powell', travelTime: 2 },
    { code: 'CIVC', name: 'Civic Center', travelTime: 4 },
    { code: '16TH', name: '16th St Mission', travelTime: 7 },
    { code: '24TH', name: '24th St Mission', travelTime: 9 }
  ];

  transferStations.forEach(({ code, name, travelTime }) => {
    const stationInfo = stationData[code];
    if (!stationInfo) {
      // console.log(`No station data for ${code}`);
      return;
    }

    const dublinTrainsAtStation = stationInfo.etd
      .filter(etd => etd.destination.includes('Dublin') || etd.destination.includes('Pleasanton'))
      .flatMap(etd => etd.estimate.map(est => ({
        minutes: parseInt(est.minutes) || 999,
        platform: est.platform || '1'
      })))
      .sort((a, b) => a.minutes - b.minutes);

    const nextDublinAtStation = dublinTrainsAtStation[0];
    // console.log(`${name} station: Dublin trains = ${dublinTrainsAtStation.map(t => t.minutes)}, next = ${nextDublinAtStation?.minutes}`);
    if (!nextDublinAtStation) return;

    // Check if we can catch this train with a reverse train
    reverseTrains.forEach(reverseTrain => {
      const arrivalTimeAtStation = reverseTrain.minutes + travelTime;
      const transferTime = arrivalTimeAtStation + TRANSFER_BUFFER;
      
      // Find Dublin trains that depart AFTER our transfer time
      const availableDublinTrains = dublinTrainsAtStation.filter(train => train.minutes >= transferTime);
      const nextAvailableDublin = availableDublinTrains[0];
      
      // Only consider this transfer if there's a Dublin train available and reverse train departs after 9 min from now
      if (nextAvailableDublin && reverseTrain.minutes > travelTimeToEmbarcadero) {
        transferOptions.push({
          station: name,
          code,
          totalTime: nextAvailableDublin.minutes,
          reverseTrainTime: reverseTrain.minutes,
          dublinTrainTime: nextAvailableDublin.minutes,
          arrivalTimeAtStation,
          travelTime
        });
      }
    });
  });

  // Find the fastest option
  const bestTransfer = transferOptions.sort((a, b) => a.totalTime - b.totalTime)[0];
  
  // console.log('Transfer analysis:', {
  //   reverseTrainsCount: reverseTrains.length,
  //   reverseTrainsAvailable: reverseTrains.filter(t => t.minutes > COMMUTE_TO_STATION_TIME),
  //   transferOptionsFound: transferOptions.length,
  //   nextDublinTrainTime: nextDublinTrain.minutes,
  //   bestTransferTime: bestTransfer?.totalTime
  // });
  
  if (bestTransfer && bestTransfer.totalTime < nextDublinTrain.minutes) {
    const timeSaved = nextDublinTrain.minutes - bestTransfer.totalTime;
    const reverseTrainInfo = reverseTrains.find(t => t.minutes === bestTransfer.reverseTrainTime);
    
    const etaAtDublin = bestTransfer.dublinTrainTime + EMBR_TO_DUBLIN_TRAVEL_TIME;
    
    return {
      type: 'transfer',
      totalTime: bestTransfer.totalTime,
      etaAtDublin: calculateDepartureTime(etaAtDublin),
      steps: [
        {
          action: `Take ${reverseTrainInfo?.destination || 'reverse'} train`,
          station: 'Embarcadero',
          platform: reverseTrainInfo?.platform || '2',
          waitTime: bestTransfer.reverseTrainTime,
          departureTime: calculateDepartureTime(bestTransfer.reverseTrainTime)
        },
        {
          action: 'Arrive and transfer',
          station: bestTransfer.station,
          arrivalTime: calculateDepartureTime(bestTransfer.arrivalTimeAtStation),
          transferTime: TRANSFER_BUFFER
        },
        {
          action: 'Board Dublin/Pleasanton train',
          station: bestTransfer.station,
          platform: '1',
          waitTime: bestTransfer.dublinTrainTime,
          departureTime: calculateDepartureTime(bestTransfer.dublinTrainTime),
          waitTimeAtStation: Math.max(0, bestTransfer.dublinTrainTime - bestTransfer.arrivalTimeAtStation - TRANSFER_BUFFER)
        }
      ]
    };
  }

  // Direct route is best
  const etaAtDublin = nextDublinTrain.minutes + EMBR_TO_DUBLIN_TRAVEL_TIME;
  
  return {
    type: 'direct',
    totalTime: nextDublinTrain.minutes,
    etaAtDublin: calculateDepartureTime(etaAtDublin),
    steps: [
      {
        action: 'Take direct Dublin/Pleasanton train',
        station: 'Embarcadero',
        platform: nextDublinTrain.platform,
        waitTime: nextDublinTrain.minutes,
        departureTime: calculateDepartureTime(nextDublinTrain.minutes)
      }
    ]
  };
}
