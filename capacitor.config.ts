import type { CapacitorConfig } from '@capacitor/cli';

// The web assets are bundled INTO the APK (webDir 'dist', no server.url) so the
// app loads instantly and works without first-paint connectivity. All data
// flows over HTTPS to https://api.uniesales.com like any API client.
const config: CapacitorConfig = {
  appId: 'com.uniesales.mobile',
  appName: 'UnieSales',
  webDir: 'dist',
  backgroundColor: '#000000',
  android: {
    // Keep the native splash dark to match the iOS-style theme.
    backgroundColor: '#000000',
  },
  plugins: {
    // Route fetch()/XHR through native HTTP so API calls aren't subject to the
    // WebView's CORS preflight (api.uniesales.com doesn't allow the
    // https://localhost app origin, which otherwise fails as "failed to fetch").
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
