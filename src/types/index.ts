export interface User {
  id: string;
  username: string;
  stationId: string;
}

export interface Vehicle {
  id: string;
  name: string;
  capacityKWh: number;
  type: 'sedan' | 'suv' | 'truck';
  priority: 'normal' | 'emergency';
}

export interface DriverInfo {
  id: string;
  name: string;
  email: string;
  vehicleId: string;
  vehicleName: string;
}

export interface QueueEntry {
  userId: string;
  vehicleId: string;
  vehicleName: string;
  joinedAt: string;
  chargingStatus: 'charging' | 'waiting';
}

export type DriverInQueue = QueueEntry & {
  driverId: string; // The key in the queue object
  priority: Vehicle['priority'];
};


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

export interface LedgerEntry {
  id?: string;
  stationId: string;
  userId: string;
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  kWhDelivered: number;
  pricePerKWh: number;
  cost: number;
  platformFee: number;
  totalAmount: number;
  receiptSent: boolean;
}
