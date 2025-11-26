import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from 'http-proxy-middleware';

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy /api requests to the Python backend
  // Note: We use '/api/**' as the context AND specify pathRewrite to ensure /api is preserved
  app.use(createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    filter: (pathname) => pathname.startsWith('/api'),
    logLevel: 'debug',
  }));

  const httpServer = createServer(app);

  return httpServer;
}
