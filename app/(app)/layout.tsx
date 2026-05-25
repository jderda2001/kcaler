import { BottomNav } from '@/components/BottomNav';
import { InstallPrompt } from '@/components/InstallPrompt';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ProfileGate } from '@/components/ProfileGate';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileGate>
      <OfflineIndicator />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
      <InstallPrompt />
    </ProfileGate>
  );
}
