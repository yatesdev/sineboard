import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    // level: 'info',
    // format: format.json(),
    // transports: [
    //   //
    //   // - Write to all logs with level `info` and below to `combined.log`
    //   // - Write all logs error (and below) to `error.log`.
    //   //
    //   new transports.File({ filename: 'error.log', level: 'error' }),
    //   new transports.File({ filename: 'combined.log' }),
    // ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
      level: 'debug',
      format: format.combine(format.colorize(), format.simple()),
    }));
}

export { logger as Logger };
