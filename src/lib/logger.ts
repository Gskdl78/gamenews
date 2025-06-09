import pino from 'pino';

// 建立一個 Pino logger 實例
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: false,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
}); 