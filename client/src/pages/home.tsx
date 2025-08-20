import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchStationData, fetchRouteRecommendation, processBartTrains, getBartLineColor, processAllTrains, calculateDepartureTime } from "@/lib/bart-api";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Train, RefreshCcw, Route, Clock, ArrowRight, AlertCircle, Info, MapPin, ArrowUpDown } from "lucide-react";
import type { ProcessedTrain, BartStationData, RouteRecommendation } from "@/types/bart";

export default function Home() {
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Fetch direct trains from Embarcadero
  const { 
    data: embarcaderoData, 
    isLoading: isLoadingEmbarcadero, 
    error: embarcaderoError,
    refetch: refetchEmbarcadero 
  } = useQuery<BartStationData>({
    queryKey: ['/api/bart/station/EMBR'],
    refetchInterval: 30000,
    retry: 2
  });

  // Fetch route recommendation
  const { 
    data: recommendation, 
    isLoading: isLoadingRecommendation,
    error: recommendationError,
    refetch: refetchRecommendation 
  } = useQuery<RouteRecommendation>({
    queryKey: ['/api/bart/route-recommendation'],
    refetchInterval: 30000,
    retry: 2
  });

  const allTrains = embarcaderoData ? processAllTrains(embarcaderoData) : { 
    dublinTrains: [], 
    towardsSFTrains: [], 
    awayFromSFTrains: [] 
  };
  const directTrains = allTrains.dublinTrains;
  const towardsSFTrains = allTrains.towardsSFTrains;
  const awayFromSFTrains = allTrains.awayFromSFTrains;
  const isLoading = isLoadingEmbarcadero || isLoadingRecommendation;
  const hasError = embarcaderoError || recommendationError;

  useEffect(() => {
    const updateTimestamp = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      setLastUpdated(timeString);
    };

    updateTimestamp();
    const interval = setInterval(updateTimestamp, 1000);
    return () => clearInterval(interval);
  }, [embarcaderoData, recommendation]);

  const handleRefresh = () => {
    refetchEmbarcadero();
    refetchRecommendation();
  };

  const getStatusBanner = () => {
    if (hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Service Unavailable</span>
          </div>
          <p className="text-xs text-red-700 mt-1">Unable to connect to BART API</p>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span className="text-sm font-medium text-green-800">Service Operating Normally</span>
        </div>
        <p className="text-xs text-green-700 mt-1">Last updated: {lastUpdated}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-bart-blue rounded-lg flex items-center justify-center">
                <Train className="text-white" size={16} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">BART Commute</h1>
                <p className="text-xs text-slate-500">Embarcadero to Dublin/Pleasanton</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
              data-testid="button-refresh"
            >
              <RefreshCcw 
                className={`text-slate-600 ${isLoading ? 'animate-spin' : ''}`} 
                size={16} 
              />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Status Banner */}
            {getStatusBanner()}

            {/* Visual Route Timeline */}
            {recommendation && !hasError && (
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-bart-blue to-blue-600 p-3 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {recommendation.type === 'transfer' ? 'Recommended Route' : 'Direct Route'}
                    </h2>
                    <div className="text-right">
                      <div className="text-xl font-bold" data-testid="text-total-time">
                        {recommendation.totalTime}min
                      </div>
                      {recommendation.timeSaved && (
                        <div className="text-blue-100 text-xs">Save {recommendation.timeSaved}min</div>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <RouteTimeline steps={recommendation.steps} />
                </CardContent>
              </Card>
            )}

        {/* Direct Trains Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Direct from Embarcadero</h3>
          
          {isLoading ? (
            <LoadingSkeleton />
          ) : hasError ? (
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-slate-600">Unable to load train information</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh} 
                  className="mt-2"
                  data-testid="button-retry"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : directTrains.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-slate-600">No Dublin/Pleasanton trains scheduled</p>
              </CardContent>
            </Card>
          ) : (
            directTrains.slice(0, 5).map((train, index) => (
              <TrainCard key={index} train={train} />
            ))
          )}
            </div>
          </div>

          {/* Sidebar - Other Direction Trains */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-3">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                  <Info size={14} className="mr-1" />
                  Other Directions
                </h4>
                
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 bg-slate-100 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Towards SF City */}
                    {towardsSFTrains.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                          → SF City
                        </h5>
                        {towardsSFTrains.slice(0, 2).map((train, index) => (
                          <div key={`sf-${index}`} className="mb-2 last:mb-0">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getBartLineColor(train.color)}`}></div>
                                <span className="text-slate-600 truncate max-w-16">{train.destination.split(' ')[0]}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-slate-800">
                                  {train.minutes === 0 ? 'Now' : `${train.minutes}m`}
                                </div>
                                <div className="text-slate-400 text-xs">
                                  {calculateDepartureTime(train.minutes)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Away from SF City */}
                    {awayFromSFTrains.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                          ← Away from SF
                        </h5>
                        {awayFromSFTrains.slice(0, 2).map((train, index) => (
                          <div key={`away-${index}`} className="mb-2 last:mb-0">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getBartLineColor(train.color)}`}></div>
                                <span className="text-slate-600 truncate max-w-16">{train.destination.split(' ')[0]}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-slate-800">
                                  {train.minutes === 0 ? 'Now' : `${train.minutes}m`}
                                </div>
                                <div className="text-slate-400 text-xs">
                                  {calculateDepartureTime(train.minutes)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto p-4 mt-8 text-center">
        <div className="text-xs text-slate-500">
          Data provided by BART Legacy API
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Updates every 30 seconds
        </div>
      </footer>
    </div>
  );
}

function RouteTimeline({ steps }: { steps: any[] }) {
  return (
    <div className="relative">
      <div className="space-y-3">
        {steps.map((step: any, index: number) => {
          const isLastStep = index === steps.length - 1;
          const isTransfer = step.action.toLowerCase().includes('transfer');
          const isReverse = step.action.includes('reverse') || step.action.includes('Richmond') || step.action.includes('Daly');
          
          return (
            <div key={index} className="flex items-center space-x-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                  isTransfer 
                    ? 'bg-amber-500 border-amber-500' 
                    : isReverse 
                      ? 'bg-bart-red border-bart-red' 
                      : 'bg-bart-blue border-bart-blue'
                }`}>
                  {isTransfer ? (
                    <ArrowUpDown size={6} className="text-white" />
                  ) : (
                    <Train size={6} className="text-white" />
                  )}
                </div>
                {!isLastStep && (
                  <div className={`w-0.5 h-6 mt-1 ${
                    isReverse ? 'bg-bart-red' : 'bg-bart-blue'
                  } opacity-30`}></div>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 text-sm truncate">
                      {step.action}
                    </div>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <MapPin size={10} className="text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600 text-xs truncate">{step.station}</span>
                      {step.platform && (
                        <span className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600 flex-shrink-0">
                          P{step.platform}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {step.waitTime !== undefined && (
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-bold text-slate-900">
                        {step.waitTime}min
                      </div>
                      <div className="text-xs text-slate-500">
                        {calculateDepartureTime(step.waitTime)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrainCard({ train }: { train: ProcessedTrain }) {
  const colorClass = getBartLineColor(train.color);
  
  return (
    <Card data-testid={`card-train-${train.destination.replace(/\s+/g, '-').toLowerCase()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
            <div>
              <div className="font-semibold text-slate-900" data-testid="text-destination">
                {train.destination}
              </div>
              <div className="text-sm text-slate-600">
                Platform <span data-testid="text-platform">{train.platform}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900" data-testid="text-minutes">
              {train.minutes === 0 ? 'Leaving' : train.minutes}
            </div>
            {train.minutes > 0 && (
              <div className="text-xs text-slate-500">min</div>
            )}
            <div className="text-xs text-slate-400 mt-1" data-testid="text-departure-time">
              {calculateDepartureTime(train.minutes)}
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          <div className={`text-xs px-2 py-1 rounded-full ${
            train.cars >= 10 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}>
            <Train size={10} className="inline mr-1" />
            {train.cars} cars
          </div>
          <div className={`text-xs ${
            train.status === 'delayed' ? 'text-amber-600' : 'text-slate-500'
          }`}>
            {train.status === 'delayed' ? `${train.delay} min delay` : 'On time'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
