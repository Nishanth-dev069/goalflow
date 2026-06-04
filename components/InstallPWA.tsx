'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { X, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallPWA() {
  const { isInstallable, isIOS, isStandalone, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check local storage only on client side
    const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    setDismissed(isDismissed);
  }, []);

  if (isStandalone || dismissed || !isInstallable) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card text-card-foreground p-4 rounded-xl shadow-lg border border-border z-50 flex flex-col gap-3">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="pr-6">
        <h3 className="font-semibold text-sm">Install GoalFlow</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Install our app for a better offline experience and easy access.
        </p>
      </div>

      {isIOS ? (
        <div className="text-xs flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
          Tap <Share className="h-4 w-4" /> then &quot;Add to Home Screen&quot; <PlusSquare className="h-4 w-4" />
        </div>
      ) : (
        <Button onClick={promptInstall} size="sm" className="w-full">
          Install App
        </Button>
      )}
    </div>
  );
}
