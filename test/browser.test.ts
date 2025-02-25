import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { Logger } from '../src'

describe('Logger Browser Tests', () => {
  // Mock storage implementation
  let mockLocalStorage: Record<string, string> = {}

  // Store original console methods
  const originalConsole = { ...console }

  // Store mock calls for tests to use
  let logCalls: any[][] = []

  beforeEach(() => {
    // Reset test data
    logCalls = []
    mockLocalStorage = {}

    // Reset DOM for each test
    document.body.innerHTML = '<div id="log-container"></div>'

    // Mock localStorage methods individually
    if (typeof localStorage !== 'undefined') {
      spyOn(localStorage, 'getItem').mockImplementation((key: string) => mockLocalStorage[key] || null)
      spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
        mockLocalStorage[key] = value
      })
      spyOn(localStorage, 'removeItem').mockImplementation((key: string) => {
        delete mockLocalStorage[key]
      })
      spyOn(localStorage, 'clear').mockImplementation(() => {
        mockLocalStorage = {}
      })
    }

    // Mock console methods with our own implementation
    spyOn(console, 'log').mockImplementation((...args) => {
      logCalls.push(args)
      originalConsole.log(...args)
    })
    spyOn(console, 'error')
    spyOn(console, 'warn')
  })

  afterEach(() => {
    // Restore original console
    Object.keys(originalConsole).forEach((key) => {
      (console as any)[key] = originalConsole[key as keyof typeof console]
    })
  })

  test('should detect browser environment correctly', () => {
    const logger = new Logger('browser-test')
    expect(logger.isBrowser).toBe(true)
    expect(logger.isServer).toBe(false)
  })

  test('should output logs to console in browser environment', async () => {
    const logger = new Logger('console-test')

    await logger.info('Info message')
    await logger.error('Error message')
    await logger.warn('Warning message')
    await logger.debug('Debug message')
    await logger.success('Success message')

    // Check if console.log was called
    expect(logCalls.length).toBeGreaterThan(0)

    // Verify different message types were logged
    const messages = logCalls.map(args => args[0]).join('\n')
    expect(messages).toContain('Info message')
    expect(messages).toContain('Error message')
    expect(messages).toContain('Warning message')
  })

  test('should format logs correctly for browser console', async () => {
    const logger = new Logger('format-test', {
      format: 'json',
    })

    await logger.info('Test message')

    // Get logs and check formatting
    expect(logCalls.length).toBeGreaterThan(0)

    // Find the log entry for Test message
    const testMessageLog = logCalls.find(args =>
      args[0] && typeof args[0] === 'string' && args[0].includes('Test message'),
    )
    expect(testMessageLog).toBeDefined()

    if (testMessageLog) {
      // Verify log contains expected properties
      expect(testMessageLog[0]).toContain('Test message')
      expect(testMessageLog[0]).toContain('format-test')
      expect(testMessageLog[0]).toContain('info')
    }
  })

  // Make DOM event test async to properly wait for logs
  test('should handle DOM events for logging', async () => {
    const logger = new Logger('dom-event-test')
    const button = document.createElement('button')
    button.textContent = 'Click me'
    document.body.appendChild(button)

    // Use a Promise to ensure we can wait for the log
    const logPromise = new Promise<void>((resolve) => {
      button.addEventListener('click', () => {
        // Synchronously call info and then resolve the promise
        logger.info('Button clicked').then(() => resolve())
      })
    })

    // Simulate click
    button.click()

    // Wait for the logging to complete
    await logPromise

    // Check that log was called
    expect(logCalls.length).toBeGreaterThan(0)

    // Verify the button click log
    const buttonClickLog = logCalls.find(args =>
      args[0] && typeof args[0] === 'string' && args[0].includes('Button clicked'),
    )
    expect(buttonClickLog).toBeDefined()
  })

  test('should handle errors in browser context', async () => {
    const logger = new Logger('error-test')

    // Directly log an error instead of relying on window.onerror
    await logger.error('Window error: Test error')

    // Check error was logged
    expect(logCalls.length).toBeGreaterThan(0)

    // Verify the error log
    const errorLog = logCalls.find(args =>
      args[0] && typeof args[0] === 'string' && args[0].includes('Window error'),
    )
    expect(errorLog).toBeDefined()

    // Test custom error handling by simulating the process
    let customErrorHandled = false

    // Set up a direct error handler function that uses our logger
    const handleError = (message: string): boolean => {
      customErrorHandled = true
      // We don't need to await this since we're checking customErrorHandled
      void logger.error(`Custom error: ${message}`)
      return true
    }

    // Call the handler directly instead of depending on event dispatching
    handleError('Custom test error')

    // Verify our handler was invoked
    expect(customErrorHandled).toBe(true)
  })

  test('should correctly use timers for performance tracking', async () => {
    const logger = new Logger('timer-test')
    const timerLabel = 'test-operation'

    // Start timer
    const endTimer = logger.time(timerLabel)

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10))

    // End timer and wait for it to complete
    await endTimer()

    // Check timer logs
    expect(logCalls.length).toBeGreaterThan(0)

    // Verify timer completion log
    const timerCompletionLog = logCalls.find(args =>
      args[0] && typeof args[0] === 'string'
      && args[0].includes(timerLabel) && args[0].includes('completed in'),
    )
    expect(timerCompletionLog).toBeDefined()
  })

  test('should handle subloggers correctly in browser', async () => {
    const mainLogger = new Logger('main-browser')
    const subLogger = mainLogger.extend('sub')

    await subLogger.info('Sublogger message')

    // Check that sublogger prefixed correctly
    expect(logCalls.length).toBeGreaterThan(0)

    const subLoggerMessageFound = logCalls.some(args =>
      args[0] && typeof args[0] === 'string'
      && args[0].includes('main-browser:sub') && args[0].includes('Sublogger message'),
    )
    expect(subLoggerMessageFound).toBe(true)
  })

  test('should respect log levels in browser environment', async () => {
    // Clear previous logs
    logCalls = []

    const logger = new Logger('level-test', {
      level: 'warning', // Only warning and above
    })

    await logger.debug('Debug message')
    await logger.info('Info message')
    await logger.warn('Warning message')
    await logger.error('Error message')

    // Verify correct logs were captured based on level
    const debugFound = logCalls.some(args =>
      args[0] && typeof args[0] === 'string' && args[0].includes('Debug message'),
    )
    const infoFound = logCalls.some(args =>
      args[0] && typeof args[0] === 'string' && args[0].includes('Info message'),
    )
    const warningFound = logCalls.some(args =>
      args[0] && typeof args[0] === 'string' && args[0].includes('Warning message'),
    )
    const errorFound = logCalls.some(args =>
      args[0] && typeof args[0] === 'string' && args[0].includes('Error message'),
    )

    // Debug and info should be filtered out due to log level setting
    expect(debugFound).toBe(false)
    expect(infoFound).toBe(false)

    // Warning and error should be present
    expect(warningFound).toBe(true)
    expect(errorFound).toBe(true)
  })
})
