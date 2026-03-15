import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// WebXR requires HTTPS. basic-ssl generates a self-signed cert for local dev.
// --host in the dev script exposes the server on your LAN so your Quest headset can connect.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
  },
});
