import { BottomNav } from '@/components/BottomNav';
import { InstallPrompt } from '@/components/InstallPrompt';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ProfileGate } from '@/components/ProfileGate';
import { SyncClient } from '@/components/SyncClient';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileGate>
      <SyncClient />
      <OfflineIndicator />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
      <InstallPrompt />
    </ProfileGate>
  );
}
