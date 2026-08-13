import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.token', 'req.body.email'],
    censor: '[REDACTED]'
  }
});

export default logger;
