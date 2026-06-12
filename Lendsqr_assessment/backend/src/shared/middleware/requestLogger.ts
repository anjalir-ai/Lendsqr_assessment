import { pinoHttp } from 'pino-http';

export const requestLogger = pinoHttp({
  redact: ['req.headers.authorization'],
  quietReqLogger: true
});
