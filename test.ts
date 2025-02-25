/* eslint-disable antfu/no-top-level-await */
import process from 'node:process'
import { Logger } from './src/logger'

// 1. Basic Logger Setup
const logger = new Logger('test', {
  level: 'debug',
  format: 'json',
  timestamp: new Date(),
})

// 2. Basic Logging Levels
await logger.debug('This is a debug message')
await logger.info('This is an info message')
await logger.success('This is a success message')
await logger.warn('This is a warning message')
await logger.error('This is an error message')

// 3. Format String Support
await logger.info('Found %d errors in %s', 3, 'document.txt')

// 4. Performance Tracking
const end = logger.time('Starting expensive operation...')
await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate work
await end() // Will show time taken

// 5. Domain-specific logging with extend
const dbLogger = logger.extend('database')
await dbLogger.info('Connected to database') // Will show [test:database]

const apiLogger = logger.extend('api')
await apiLogger.info('API request received') // Will show [test:api]

// 6. Conditional Execution
logger.only(() => {
  logger.info('This runs only when logging is enabled')
})

// 7. Object Logging
await logger.info('User details:', {
  id: 123,
  name: 'John Doe',
  role: 'admin',
})

// Exit after all async operations
setTimeout(() => process.exit(0), 100)
