import { PrettyFormatter } from './src/formatters/pretty'
import { Logger } from './src/logger'

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testPrettyFormatter() {
  // Create a logger with text formatting initially
  const logger = new Logger('console-demo', {
    format: 'text',
    logDirectory: './logs',
    level: 'debug',
  })

  // Manually set the pretty formatter
  // @ts-expect-error - Accessing private property
  logger.formatter = new PrettyFormatter(logger.config)

  // Log header with the logger itself
  await logger.info('Testing Pretty Formatter')

  // Simple log examples
  await logger.debug('Debugging information: Connection attempt 3 of 5')
  await sleep(100)

  await logger.info('System starting up with configuration: %j', {
    port: 3000,
    env: 'development',
    features: ['auth', 'api', 'webhooks'],
  })
  await sleep(100)

  await logger.success('Successfully connected to database')
  await sleep(100)

  // Box-formatted warning
  await logger.warn('A new version of consola is available: 3.0.1')
  await sleep(100)

  // Performance tracking
  const end = logger.time('Operation')
  await sleep(500)
  await end()

  // Sub-logger demonstration
  const networkLogger = logger.extend('network')
  // @ts-expect-error - Accessing private property
  networkLogger.formatter = new PrettyFormatter(networkLogger.config)
  await networkLogger.info('Established connection to API endpoint')
  await sleep(100)

  const securityLogger = logger.extend('security')
  // @ts-expect-error - Accessing private property
  securityLogger.formatter = new PrettyFormatter(securityLogger.config)
  await securityLogger.warn('Rate limiting applied to IP 192.168.1.254')
  await sleep(100)

  // Show a simple box with the logger
  await logger.info('I am a simple box')
  await sleep(100)

  // Deployment question
  await logger.info('Deploy to the production?')
  await logger.info('● Yes ○ No')
  await sleep(100)

  // Error with stack trace in box
  try {
    throw new Error('This is an example error. Everything is fine!')
  }
  catch (error: any) {
    // Format the stack trace for better display
    const stackLines = error.stack.split('\n').slice(1).join('\n')
    await logger.error(`${error.message}\n${stackLines}`)
  }

  // Clean up
  await logger.destroy()
  await logger.info('Formatting demo complete!')

  return logger // Return the logger for the catch handler
}

// Create a logger for the catch block to avoid undefined reference
const errorLogger = new Logger('error-handler')
testPrettyFormatter().catch(err => errorLogger.error('Test failed:', err))
