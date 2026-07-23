import { randomUUID } from 'crypto'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

interface LogPayload {
  level: LogLevel
  action: string
  message: string
  tenantId?: string
  userId?: string
  correlationId: string
  metadata?: Record<string, unknown>
  error?: Error | unknown
  timestamp: string
}

export interface LoggerContext {
  tenantId?: string
  userId?: string
  correlationId?: string
  metadata?: Record<string, unknown>
  error?: unknown
  [key: string]: any
}

class EnterpriseLogger {
  private static instance: EnterpriseLogger

  private constructor() {}

  public static getInstance(): EnterpriseLogger {
    if (!EnterpriseLogger.instance) {
      EnterpriseLogger.instance = new EnterpriseLogger()
    }
    return EnterpriseLogger.instance
  }

  private formatError(error: unknown): Record<string, any> | undefined {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        // Stack traces are captured but should be shipped to Sentry/Datadog, not exposed to clients
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }
    return typeof error === 'object' ? (error as Record<string, any>) : { value: String(error) }
  }

  private log(
    level: LogLevel,
    action: string,
    message: string,
    context: LoggerContext
  ) {
    const payload: LogPayload = {
      level,
      action,
      message,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId: context.correlationId || randomUUID(),
      metadata: context.metadata,
      error: context.error ? this.formatError(context.error) : undefined,
      timestamp: new Date().toISOString()
    }

    // In a real enterprise system, this JSON string is piped to stdout
    // and picked up by a log forwarder (FluentBit/Datadog Agent)
    const logString = JSON.stringify(payload)

    if (level === 'ERROR') {
      console.error(logString)
      // TODO: Integrate Sentry here
      // Sentry.captureException(context.error, { tags: { tenantId: context.tenantId, correlationId: payload.correlationId }})
    } else if (level === 'WARN') {
      console.warn(logString)
    } else if (level === 'DEBUG') {
      if (process.env.NODE_ENV === 'development') {
        console.debug(logString)
      }
    } else {
      console.info(logString)
    }
  }

  info(action: string, message: string, context: LoggerContext = {}) {
    this.log('INFO', action, message, context)
  }

  warn(action: string, message: string, context: LoggerContext = {}) {
    this.log('WARN', action, message, context)
  }

  error(action: string, message: string, error: unknown, context: LoggerContext = {}) {
    this.log('ERROR', action, message, { ...context, error })
  }
}

export const logger = EnterpriseLogger.getInstance()
