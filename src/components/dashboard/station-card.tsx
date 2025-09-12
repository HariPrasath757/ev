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
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Station } from '@/types';
import ReportIssueDialog from './report-issue-dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
      color: 'default',
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
  const starPercentage = (score / totalStars) * 100;
  const starPercentageRounded = `${Math.round(starPercentage / 10) * 10}%`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <div className="relative">
          <div className="flex text-muted-foreground">
            {[...Array(totalStars)].map((_, i) => (
              <Star key={`empty-${i}`} className="h-5 w-5" />
            ))}
          </div>
          <div
            className="absolute top-0 left-0 h-full overflow-hidden flex"
            style={{ width: starPercentageRounded }}
          >
            {[...Array(totalStars)].map((_, i) => (
              <Star key={`filled-${i}`} className="h-5 w-5 flex-shrink-0 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        </div>
      </div>
      <span className="font-semibold text-foreground">{score.toFixed(1)}/5</span>
    </div>
  );
};

export default function StationCard({ station, userId }: StationCardProps) {
  const statusInfo = getStatusInfo(station);
  const placeholderImage = PlaceHolderImages.find(img => img.id === station.id) || PlaceHolderImages[0];

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
        
        {statusInfo.text === 'Occupied' && (
          <div className="mt-6">
            <h4 className="font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Waiting Queue</h4>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground bg-card-foreground/5 p-3 rounded-md">
              {station.queue && Object.keys(station.queue).length > 0 ? (
                <ul className="space-y-2">
                  {Object.entries(station.queue).map(([driverId, details]) => (
                    <li key={driverId} className="flex items-start gap-3 p-2 rounded-md bg-background/50">
                      <User className="h-4 w-4 mt-1 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{details.vehicle}</p>
                        <p className="text-xs text-muted-foreground">User: {details.userId}</p>
                        <p className="text-xs text-muted-foreground">Joined: {new Date(details.joinedAt).toLocaleTimeString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-2">No queue</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <ReportIssueDialog stationId={station.id} stationName={station.name} userId={userId} />
      </CardFooter>
    </Card>
  );
}
