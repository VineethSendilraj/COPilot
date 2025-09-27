import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Voice AI',
  pageTitle: 'Voice AI Assistant',
  pageDescription: 'An intelligent voice assistant powered by AI',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/ai-logo.svg',
  accent: '#6366f1',
  logoDark: '/ai-logo-dark.svg',
  accentDark: '#8b5cf6',
  startButtonText: 'Start call',

  agentName: undefined,
};
