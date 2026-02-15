'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'keyhomekey_privacy_consent';

interface ConsentData {
  accepted: boolean;
  timestamp: string;
}

export function usePrivacyConsent() {
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: ConsentData = JSON.parse(stored);
        setHasConsented(data.accepted);
      }
    } catch (error) {
      console.error('Error reading privacy consent:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const giveConsent = () => {
    try {
      const consentData: ConsentData = {
        accepted: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
      setHasConsented(true);
    } catch (error) {
      console.error('Error saving privacy consent:', error);
    }
  };

  return {
    hasConsented,
    isLoading,
    giveConsent,
  };
}
