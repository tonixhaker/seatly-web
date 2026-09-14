import createClient from 'openapi-fetch';
import { authMiddleware } from './middleware';

export type HoldSeatsBody = {
  event_id: number;
  seat_ids: number[];
  session_id: string;
};

export type LiveSeats = {
  held: number[];
  sold: number[];
};

type ValidationFailed = {
  error: {
    code: 'VALIDATION_FAILED';
    message: string;
    details?: Record<string, unknown>;
  };
};

type SeatsConflict = {
  error: {
    code: 'SEATS_CONFLICT';
    message: string;
    details: { conflicting_seat_ids: number[] };
  };
};

export type paths = {
  '/holds': {
    post: {
      requestBody: { content: { 'application/json': HoldSeatsBody } };
      responses: {
        201: { content?: never };
        400: { content: { 'application/json': ValidationFailed } };
        409: { content: { 'application/json': SeatsConflict } };
      };
    };
    delete: {
      requestBody: { content: { 'application/json': HoldSeatsBody } };
      responses: {
        204: { content?: never };
        400: { content: { 'application/json': ValidationFailed } };
      };
    };
  };
  '/events/{id}/live-seats': {
    get: {
      parameters: { path: { id: number } };
      responses: {
        200: { content: { 'application/json': LiveSeats } };
        400: { content: { 'application/json': ValidationFailed } };
      };
    };
  };
};

export const realtimeClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_REALTIME_BASE_URL,
});

realtimeClient.use(authMiddleware);
