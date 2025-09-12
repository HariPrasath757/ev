'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '../ui/button';
import { LogOut, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-primary">EvolveNet Manager</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Welcome, {user?.username}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
