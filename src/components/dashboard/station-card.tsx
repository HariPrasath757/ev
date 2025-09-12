'use client';

import Image from 'next/image';
import {
  Zap,
  Plug,
  WifiOff,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  BatteryCharging,
  User,
  X,
  ArrowUpCircle,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Station, Driver } from '@/types';
import ReportIssueDialog from './report-issue-dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { removeDriverFromQueue, promoteDriverToCharging } from '@/actions/queue-management';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import AddDriverDialog from './add-driver-dialog';

type StationCardProps = {
  station: Station;
  userId: string;
};

const getStatusInfo = (station: Station) => {
  if (station.status === 'offline') {
    return {
      text: 'Offline',
      color: 'destructive',
      icon: <WifiOff className="h-4 w-4" />,
    };
  }
  if (station.availablePorts > 0) {
    return {
      text: 'Available',
      color: 'accent',
      icon: <Plug className="h-4 w-4" />,
    };
  }
  return {
    text: 'Occupied',
    color: 'secondary',
    icon: <Zap className="h-4 w-4" />,
  };
};

const TrustScore = ({ score }: { score: number }) => {
  const totalStars = 5;
  const fullStars = Math.floor(score);
  const partialStarPercentage = (score - fullStars) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-5 w-5 text-yellow-400 fill-current" />
        ))}
        {fullStars < 5 && (
          <div className="relative">
            <Star className="h-5 w-5 text-muted-foreground" />
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{ width: `${partialStarPercentage}%` }}
            >
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
            </div>
          </div>
        )}
        {[...Array(Math.max(0, 4 - fullStars))].map((_, i) => (
            <Star key={`empty-${i}`} className="h-5 w-5 text-muted-foreground" />
        ))}
      </div>
      <span className="font-semibold text-foreground">{score.toFixed(1)}/5</span>
    </div>
  );
};

export default function StationCard({ station, userId }: StationCardProps) {
  const statusInfo = getStatusInfo(station);
  const placeholderImage = PlaceHolderImages.find(img => img.id === station.id) || PlaceHolderImages[0];
  const { toast } = useToast();

  const handleRemoveDriver = async (driverId: string) => {
    const result = await removeDriverFromQueue(station.id, driverId);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handlePromoteDriver = async (driverId: string) => {
    const result = await promoteDriverToCharging(station.id, driverId);
     if (result.success) {
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  }

  const getDriversByStatus = (status: 'charging' | 'waiting'): Driver[] => {
    if (!station.queue) return [];
    return Object.entries(station.queue)
      .map(([driverId, details]) => ({ driverId, ...details }))
      .filter(driver => driver.chargingStatus === status)
      .sort((a,b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  };
  
  const chargingDrivers = getDriversByStatus('charging');
  const waitingDrivers = getDriversByStatus('waiting');

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20">
      <CardHeader className="p-0 relative">
        <Image
          src={placeholderImage.imageUrl}
          alt={station.name}
          width={600}
          height={400}
          className="w-full h-48 object-cover"
          data-ai-hint={placeholderImage.imageHint}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
            <CardTitle className="text-2xl font-bold text-white">{station.name}</CardTitle>
        </div>
        <Badge
            variant={statusInfo.color as any}
            className="absolute top-4 right-4 text-sm"
        >
            {statusInfo.icon}
            <span className="ml-2">{statusInfo.text}</span>
        </Badge>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BatteryCharging className="h-5 w-5 text-primary" />
            <div>
              <p className="text-muted-foreground">Ports</p>
              <p className="font-semibold">{station.availablePorts} / {station.totalPorts} available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
                <p className="text-muted-foreground">Est. Wait Time</p>
                <p className="font-semibold">{station.waitTime} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-semibold">${station.pricePerKWh.toFixed(2)} / kWh</p>
            </div>
          </div>
           <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-semibold">{station.location.lat.toFixed(4)}, {station.location.lng.toFixed(4)}</p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <p className="text-muted-foreground">Trust Score</p>
            <TrustScore score={station.trustScore} />
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Driver Queue</h4>
            <AddDriverDialog stationId={station.id} />
          </div>
          <div className="mt-2 space-y-4 text-sm text-muted-foreground bg-card-foreground/5 p-3 rounded-md">
            <div>
              <h5 className="font-semibold text-foreground mb-2">Currently Charging</h5>
              {chargingDrivers.length > 0 ? (
                <ul className="space-y-2">
                  {chargingDrivers.map((driver) => (
                    <li key={driver.driverId} className="flex items-center justify-between gap-3 p-2 rounded-md bg-background/50">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 mt-1 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">{driver.vehicle}</p>
                          <p className="text-xs text-muted-foreground">User: {driver.userId}</p>
                          <p className="text-xs text-muted-foreground">Joined: {new Date(driver.joinedAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveDriver(driver.driverId)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-2 text-xs">No drivers currently charging.</p>
              )}
            </div>

            <div>
              <h5 className="font-semibold text-foreground mt-4 mb-2">Waiting in Queue</h5>
               {waitingDrivers.length > 0 ? (
                <ul className="space-y-2">
                  {waitingDrivers.map((driver) => (
                    <li key={driver.driverId} className="flex items-center justify-between gap-3 p-2 rounded-md bg-background/50">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 mt-1 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">{driver.vehicle}</p>
                          <p className="text-xs text-muted-foreground">User: {driver.userId}</p>
                          <p className="text-xs text-muted-foreground">Joined: {new Date(driver.joinedAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                       <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() => handlePromoteDriver(driver.driverId)}
                        disabled={station.availablePorts <= 0}
                        title={station.availablePorts <= 0 ? 'No ports available' : 'Promote to charging'}
                      >
                        <ArrowUpCircle className="mr-1 h-3 w-3" />
                        Promote
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-2 text-xs">The waiting queue is empty.</p>
              )}
            </div>
            
            {chargingDrivers.length === 0 && waitingDrivers.length === 0 && (
                <p className="p-2 text-center">The driver queue is empty.</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <ReportIssueDialog stationId={station.id} stationName={station.name} userId={userId} />
      </CardFooter>
    </Card>
  );
}
