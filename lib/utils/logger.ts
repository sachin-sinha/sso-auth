type ErrorLoggerParams = {
  msg: string;
  error?: Error | unknown;
  fileTrace?: string;
  fields?: Record<string, unknown>;
};

export const logger = {
  /**
   * Global info logger
   * @param msg log message
   * @param fields optional additional data to log
   */
  info: (msg: string, fields?: Record<string, unknown>) => {
    console.info(`TabsFlow:LOGGER:INFO ℹ️ ~ ${msg}${formatFields(fields)}`);
  },
  /**
   * Global error logger
   * @param ErrorLoggerParams - { **msg**: string; **error**: Error; **fileTrace?**: string; **fields**?: Record<string, unknown>}
   */
  error: ({ msg, fileTrace, error, fields }: ErrorLoggerParams) => {
    const fileStr = fileTrace ? `\n📁 File: ${fileTrace}` : '';
    console.log(`TabsFlow:LOGGER:ERROR ❌ ~ ${msg}${fileStr}\n${formatFields(fields)}`, error);
  },

  /**
   * Debug logger for development
   * @param msg log message
   * @param fields optional additional data to log
   */
  debug: (msg: string, fields?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'development') return;
    console.debug(`TabsFlow:LOGGER:DEBUG 🐛 ~ ${msg}${formatFields(fields)}`);
  },

  /**
   * Warning logger
   * @param msg log message
   * @param fields optional additional data to log
   */
  warn: (msg: string, fields?: Record<string, unknown>) => {
    console.warn(`TabsFlow:LOGGER:WARN ⚠️ ~ ${msg}${formatFields(fields)}`);
  }
};

//*=== Helpers

// format fields obj
const formatFields = (fields?: Record<string, unknown>): string => {
  if (!fields) return '';

  try {
    return `\n[Fields] ${JSON.stringify(fields, null, 2)}`;
  } catch (error) {
    return `\n[Logger][Fields] <Error serializing fields: ${error}>`;
  }
};
