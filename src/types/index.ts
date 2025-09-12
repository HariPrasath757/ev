export interface User {
  id: string;
  username: string;
  stationId: string;
}

export interface QueueEntry {
  joinedAt: string;
  userId: string;
  vehicle: string;
  status: 'charging' | 'waiting';
}

export interface Station {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'offline';
  waitTime: number;
  location: {
    lat: number;
    lng: number;
  };
  totalPorts: number;
  availablePorts: number;
  pricePerKWh: number;
  trustScore: number;
  queue?: { [driverId: string]: QueueEntry };
}

export interface Report {
  id: string;
  stationId: string;
  issue: string;
  timestamp: string;
  userId:string;
  status: 'open' | 'in-progress' | 'resolved';
  severity: 'low' | 'medium' | 'high';
}
