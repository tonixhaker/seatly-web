import createClient from 'openapi-fetch';
import type { paths } from './core.gen';
import { authMiddleware } from './middleware';

export const coreClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
});

coreClient.use(authMiddleware);
