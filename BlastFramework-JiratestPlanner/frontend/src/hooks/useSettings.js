import { useState, useEffect } from 'react';
import axios from 'axios';

const STORAGE_KEY = 'jtp_settings';

const defaults = {
  jiraEmail: '',
  jiraToken: '',
  jiraBaseUrl: '',
  groqKey: '',
  groqModel: 'llama-3.3-70b-versatile',
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  // Hydrate non-sensitive values from server .env on mount
  useEffect(() => {
    axios.get('/api/config').then(({ data }) => {
      setSettings((prev) => ({
        ...prev,
        jiraEmail: prev.jiraEmail || data.jiraEmail || '',
        jiraBaseUrl: prev.jiraBaseUrl || data.jiraBaseUrl || '',
      }));
    }).catch(() => {});
  }, []);

  function saveSettings(next) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }

  function isConfigured() {
    return Boolean(
      settings.jiraEmail &&
      settings.jiraToken &&
      settings.jiraBaseUrl &&
      settings.groqKey
    );
  }

  return { settings, saveSettings, isConfigured };
}
