import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type TabId = 'dashboard' | 'pipeline' | 'directory' | 'strategic' | 'profile' | 'settings';

export function registerAndroidBackHandler(
  getActiveTab: () => TabId,
  setActiveTab: (tab: TabId) => void,
) {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const listener = App.addListener('backButton', () => {
    // 1. OverlayModal portal open → close via Escape (OverlayModal already handles it)
    if (document.querySelector('[role="dialog"]')) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return;
    }

    // 2. AI assistant panel open → close it
    if (document.querySelector('#efi-assistant-panel')) {
      window.dispatchEvent(new Event('efi:close-ai'));
      return;
    }

    // 3. Secondary tab → go back to dashboard
    if (getActiveTab() !== 'dashboard') {
      setActiveTab('dashboard');
      return;
    }

    // 4. Already on dashboard → allow default exit behavior (OS handles it)
    App.exitApp();
  });

  return () => {
    listener.then((handle) => handle.remove());
  };
}
