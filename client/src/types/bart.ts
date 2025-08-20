export interface BartTrainEstimate {
  minutes: string;
  platform: string;
  direction: string;
  length: string;
  color: string;
  hexcolor?: string;
  delay?: string;
}

export interface BartDestination {
  destination: string;
  abbreviation: string;
  estimate: BartTrainEstimate[];
}

export interface BartStationData {
  station: string;
  abbreviation: string;
  etd: BartDestination[];
}

export interface RouteStep {
  action: string;
  station: string;
  platform?: string;
  waitTime?: number;
  travelTime?: number;
}

export interface RouteRecommendation {
  type: 'direct' | 'transfer';
  totalTime: number;
  timeSaved?: number;
  steps: RouteStep[];
}

export interface ProcessedTrain {
  destination: string;
  minutes: number;
  platform: string;
  cars: number;
  color: string;
  delay?: number;
  status: 'on-time' | 'delayed';
}
