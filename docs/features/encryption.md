# Log Encryption

Clarity provides robust encryption capabilities to secure sensitive log data. Encryption is particularly valuable when logs contain personal identifiable information (PII), credentials, or other confidential information.

## Enabling Encryption

Encryption is configured as part of the rotation options:

```ts
import { Logger } from 'clarity'

const logger = new Logger('app', {
  rotation: {
    // Enable encryption with default settings
    encrypt: true,

    // Or with detailed configuration
    encrypt: {
      algorithm: 'aes-256-gcm',
      compress: true,
      keyRotation: {
        enabled: true,
        interval: 30, // days
        maxKeys: 3,
      },
    },
  },
})
```

## Encryption Algorithms

Clarity supports several secure encryption algorithms:

| Algorithm | Description | Security Level |
|-----------|-------------|---------------|
| `aes-256-cbc` | AES with 256-bit key in CBC mode | Strong |
| `aes-256-gcm` (default) | AES with 256-bit key in GCM mode (authenticated) | Very Strong |
| `chacha20-poly1305` | ChaCha20 with Poly1305 MAC | Very Strong |

```ts
const logger = new Logger('secure-app', {
  rotation: {
    encrypt: {
      // Specify encryption algorithm
      algorithm: 'aes-256-gcm',
    },
  },
})
```

GCM and ChaCha20-Poly1305 are authenticated encryption modes that provide both confidentiality and authenticity, making them more secure than CBC mode.

## Key Management

Clarity implements secure key management to protect encryption keys:

1. **Automatic key generation**: Secure random keys are generated automatically
2. **Key storage**: Keys are stored securely in memory during runtime
3. **Key rotation**: Optional automatic key rotation for enhanced security

### Key Rotation

Key rotation periodically generates new encryption keys to limit the impact of potential key compromise:

```ts
const logger = new Logger('app', {
  rotation: {
    encrypt: {
      keyRotation: {
        enabled: true, // Enable key rotation
        interval: 7, // Rotate keys weekly (days)
        maxKeys: 5, // Keep up to 5 previous keys
      },
    },
  },
})
```

When key rotation is enabled:

1. New keys are generated at the specified interval
2. Previous keys are retained to allow decryption of older logs
3. Keys older than the specified maximum are securely deleted

## Compression

To optimize storage of encrypted logs, compression can be applied before encryption:

```ts
const logger = new Logger('app', {
  rotation: {
    encrypt: {
      compress: true, // Compress data before encryption
    },
  },
})
```

Compressing data before encryption:

- Reduces storage requirements
- Improves encryption security (compressed data is more random-like)
- May slightly increase CPU usage

## Decrypting Logs

Clarity provides methods to decrypt logs when needed:

```ts
import { Logger } from 'clarity'

const logger = new Logger('secure-app', {
  // ... encryption configuration
})

// Read encrypted log content
const encryptedData = fs.readFileSync('logs/secure-app-2023-11-15.log.enc')

// Decrypt the data
const decryptedContent = await logger.decrypt(encryptedData)
console.log(decryptedContent)
```

## Security Considerations

When implementing log encryption, consider the following:

1. **Key protection**: Encryption only protects data at rest; keys must be properly secured
2. **Application access**: Ensure only authorized applications can access decryption methods
3. **Environment separation**: Use different keys for development, staging, and production
4. **Regulatory compliance**: Ensure encryption methods meet any applicable compliance requirements

## Use Cases

Encrypt logs when they contain:

- Personal identifiable information (PII)
- Healthcare information (PHI)
- Financial data
- Authentication credentials
- API keys or secrets
- Customer data subject to regulations (GDPR, CCPA, etc.)

## Performance Impact

Encryption adds some processing overhead:

- Minimal impact on logging throughput for typical applications
- May become noticeable for high-volume logging scenarios
- Compression before encryption adds additional CPU overhead but reduces I/O
- Key rotation has negligible performance impact

## Implementation Details

Clarity uses industry-standard encryption methods:

1. The `node:crypto` module provides cryptographic functions
2. Encryption keys are securely generated using cryptographically secure random number generation
3. Initialization vectors (IVs) are randomly generated for each encryption operation
4. GCM mode includes authentication tags to verify data integrity

## Example: Compliant Healthcare Logging

```ts
import { Logger } from 'clarity'

// HIPAA-compliant logger for healthcare data
const patientLogger = new Logger('patient-records', {
  rotation: {
    frequency: 'daily',
    maxFiles: 90, // Keep logs for 90 days per compliance
    compress: true,
    encrypt: {
      algorithm: 'aes-256-gcm', // Strong authenticated encryption
      compress: true,
      keyRotation: {
        enabled: true,
        interval: 7, // Weekly key rotation
        maxKeys: 13, // Keep keys for ~90 days
      },
    },
  },
})

// Log patient data securely
await patientLogger.info('Updated patient record', {
  patientId: '12345',
  updateType: 'medication',
  updatedBy: 'dr.smith',
})
```

## Best Practices

1. **Always encrypt sensitive data**: If logs contain any sensitive information, enable encryption
2. **Use key rotation**: Enable key rotation to limit the impact of potential key compromise
3. **Implement access controls**: Restrict access to log files and decryption capabilities
4. **Document key management**: Maintain documentation on key management procedures
5. **Test recovery procedures**: Regularly test the ability to decrypt logs when needed
