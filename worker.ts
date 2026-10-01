// Cloudflare Worker Entry Point
// Bridges Cloudflare Workers (wrangler deploy) with API Functions and Static Assets

import { onRequest } from './functions/api/[[route]].ts';

interface Env {
  DB?: any;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Route API requests to our fullstack database handler
    if (url.pathname.startsWith('/api')) {
      return onRequest({
        request,
        env,
        params: {},
        waitUntil: (p: Promise<any>) => ctx.waitUntil?.(p),
        next: () => env.ASSETS.fetch(request),
        data: {},
      });
    }

    // Serve static assets from dist/
    return env.ASSETS.fetch(request);
  },
};
