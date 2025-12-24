import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { CORS_ORIGIN, CORS_CREDENTIALS } from '../config';

export function setupMiddleware(app: Koa): void {
  // CORS middleware
  app.use(cors({
    origin: CORS_ORIGIN,
    credentials: CORS_CREDENTIALS,
  }));

  // Body parser middleware
  app.use(bodyParser());
}

