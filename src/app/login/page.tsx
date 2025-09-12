import LoginForm from '@/components/auth/login-form';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="bg-primary text-primary-foreground rounded-full p-3">
          <Zap className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-primary">EvolveNet Manager</h1>
        <p className="text-muted-foreground">Log in to manage your stations</p>
      </div>
      <LoginForm />
    </main>
  );
}
