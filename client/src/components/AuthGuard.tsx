import { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { StartScreen } from '../pages/StartScreen';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  if (!userId) return <StartScreen />;
  return <>{children}</>;
}
