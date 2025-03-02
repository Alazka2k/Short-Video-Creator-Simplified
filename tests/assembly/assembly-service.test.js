// Note: This test is not currently working as expected.

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const createServer = require('../../backend/services/assembly-service/server');
const { AssemblyServiceInterface } = require('../../backend/services/assembly-service');
const assemblyDataAccess = require('../../backend/services/assembly-service/data/assemblyDataAccess');
const storageService = require('../../backend/shared/utils/storage');
const knex = require('knex');

/**
 * Assembly Service Integration Tests
 * 
 * These tests verify the functionality of the assembly service without making actual API calls
 * to external services like Creatomate. All external dependencies are mocked.
 * 
 * Test Categories:
 * 1. Happy Path - Tests successful video assembly flow
 * 2. Error Handling - Tests various error scenarios
 * 
 * Each test follows the general flow:
 * 1. Setup mocks and test data
 * 2. Make requests to service endpoints
 * 3. Verify responses and state changes
 */

// Mock AssemblyServiceInterface
jest.mock('../../backend/services/assembly-service', () => {
  return {
    AssemblyServiceInterface: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      generateContent: jest.fn().mockImplementation(async (jobId, templateId) => {
        return {
          status: 'processing',
          assemblyId: 'test-assembly-id',
          jobId,
          templateId
        };
      }),
      getStatus: jest.fn().mockResolvedValue({ status: 'processing' }),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Mock knex
jest.mock('knex', () => {
  const mKnex = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({}),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ assembly_id: 'test-assembly-id' }]),
    orderBy: jest.fn().mockReturnThis()
  });
  return mKnex;
});

// Mock logger
jest.mock('../../backend/shared/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn()
  };
  mockLogger.child.mockReturnValue(mockLogger);
  return mockLogger;
});

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockStream = require('stream');
  const mockReadable = new mockStream.Readable();
  mockReadable.push('mock video data');
  mockReadable.push(null);

  return {
    S3: jest.fn().mockImplementation(() => ({
      upload: jest.fn().mockImplementation(() => ({
        promise: jest.fn().mockResolvedValue({ Location: 'https://test-bucket.s3.amazonaws.com/test.mp4' })
      })),
      getSignedUrl: jest.fn().mockReturnValue('https://test-bucket.s3.amazonaws.com/test.mp4'),
      getObject: jest.fn().mockImplementation(() => ({
        createReadStream: () => mockReadable,
        promise: jest.fn().mockResolvedValue({ Body: Buffer.from('mock video data') })
      }))
    })),
    config: {
      update: jest.fn()
    }
  };
});

// Mock external dependencies
jest.mock('../../backend/services/assembly-service/data/assemblyDataAccess');
jest.mock('../../backend/shared/utils/storage', () => ({
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://test-bucket.s3.amazonaws.com/test.mp4',
    storageKey: 'assembly/test-job/test.mp4'
  }),
  getSignedUrl: jest.fn().mockResolvedValue('https://test-bucket.s3.amazonaws.com/test.mp4'),
  initialize: jest.fn().mockResolvedValue(true),
  isInitialized: jest.fn().mockReturnValue(true),
  downloadFile: jest.fn().mockResolvedValue({
    buffer: Buffer.from('mock video data'),
    contentType: 'video/mp4',
    fileName: 'test.mp4'
  }),
  getObject: jest.fn().mockResolvedValue({
    Body: Buffer.from('mock video data'),
    ContentType: 'video/mp4'
  })
}));

// Mock fs operations
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock video data')),
    mkdir: jest.fn().mockImplementation(() => Promise.resolve()),
    access: jest.fn().mockImplementation(() => Promise.resolve()),
    stat: jest.fn().mockImplementation(() => Promise.resolve({ isFile: () => true }))
  },
  createWriteStream: jest.fn().mockReturnValue({
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn((event, cb) => {
      if (event === 'finish') {
        setImmediate(cb);
      }
      return this;
    }),
    once: jest.fn(),
    emit: jest.fn()
  }),
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn(),
    on: jest.fn((event, cb) => {
      if (event === 'end') {
        setImmediate(cb);
      }
      return this;
    }),
    once: jest.fn(),
    emit: jest.fn()
  }),
  constants: {
    F_OK: 0
  }
}));

jest.mock('creatomate');
jest.mock('../../backend/shared/utils/config', () => ({
  assembly: {
    apiKey: 'test-api-key',
    provider: 'creatomate',
    webhookBaseUrl: 'http://test.com'
  },
  services: {
    storage: {
      type: 'aws',
      config: {
        region: 'test-region',
        bucket: 'test-bucket',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        endpoint: 'https://s3.test-region.amazonaws.com'
      }
    },
    gateway: {
      url: 'http://localhost:3000'
    },
    database: {
      client: 'pg',
      connection: {
        host: 'localhost',
        database: 'test_db',
        user: 'test_user',
        password: 'test_password'
      }
    }
  },
  output: {
    directory: './data/output',
    tempDirectory: './data/temp'
  },
  media: {
    baseUrl: 'http://localhost:3000/media'
  },
  environment: 'development'
}));

// Mock knexfile
jest.mock('../../knexfile', () => ({
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      database: 'test_db',
      user: 'test_user',
      password: 'test_password'
    }
  }
}));

jest.mock('../../backend/services/job-service/data/jobDataAccess');

describe('Assembly Service Integration Tests', () => {
  let app;
  let assemblyServiceInterface;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Clear require cache for logger to ensure fresh instance
    jest.resetModules();
    
    // Create a new instance of AssemblyServiceInterface
    assemblyServiceInterface = new AssemblyServiceInterface();
    
    // Mock generateContent method
    assemblyServiceInterface.generateContent.mockImplementation(async (jobId, templateId) => {
      return {
        status: 'processing',
        assemblyId: 'test-assembly-id',
        jobId,
        templateId
      };
    });

    // Create the Express app with our mocked interface
    app = createServer(assemblyServiceInterface, storageService);

    // Mock database operations through assemblyDataAccess
    assemblyDataAccess.createAssemblyOutput.mockResolvedValue('test-assembly-id');
    assemblyDataAccess.updateAssemblyOutput.mockResolvedValue({
      assembly_id: 'test-assembly-id',
      status: 'completed'
    });
    assemblyDataAccess.getTemplateConfig.mockResolvedValue({
      template: 'test-template',
      config: { scenes: [] }
    });
    assemblyDataAccess.validateAssemblyAssets.mockResolvedValue({
      isValid: true,
      scenes: [],
      music: true
    });

    // Mock job data access
    const jobDataAccess = require('../../backend/services/job-service/data/jobDataAccess');
    jobDataAccess.getJob.mockResolvedValue({
      job_id: 'test-job-id',
      status: 'processing',
      metadata: {
        scenes: [
          { image: { publicUrl: 'test-url' } }
        ],
        llmResult: {
          scenes: [
            { description: 'test description' }
          ]
        }
      }
    });
  });

  describe('Happy Path - Full Assembly Flow', () => {
    const testJobId = 'test-job-id';
    const testTemplateId = 'test-template-id';
    const testCreatomateId = 'test-creatomate-id';

    /**
     * Test Case 1: Complete Assembly Flow
     * 
     * Tests the entire video assembly process from initial request to completion:
     * 1. Initial assembly request with jobId and templateId
     * 2. Processing status update via webhook
     * 3. Successful completion with video metadata
     * 
     * Verifies:
     * - Correct status transitions (processing → completed)
     * - Proper metadata handling
     * - Storage key and URL generation
     * - Response formats at each step
     */
    it('should handle the complete assembly flow successfully', async () => {
      const testAssemblyId = 'test-assembly-id';
      const testStorageKey = 'assembly/test-job/test.mp4';
      const testSignedUrl = 'https://test-bucket.s3.amazonaws.com/test.mp4';
      
      // Mock successful render response from Creatomate
      assemblyServiceInterface.generateContent.mockResolvedValue({
        status: 'processing',
        assemblyId: testAssemblyId,
        jobId: testJobId,
        templateId: testTemplateId
      });

      // Mock storage service operations
      const mockVideoBuffer = Buffer.from('mock video data');
      storageService.downloadFile.mockImplementation(async (url) => {
        if (url === testSignedUrl) {
          return {
            buffer: mockVideoBuffer,
            contentType: 'video/mp4',
            fileName: 'test.mp4'
          };
        }
        throw new Error('Unexpected URL in downloadFile');
      });
      
      storageService.uploadFile.mockImplementation(async (filePath, type) => {
        if (type === 'assembly') {
          return {
            url: testSignedUrl,
            storageKey: testStorageKey
          };
        }
        throw new Error('Unexpected type in uploadFile');
      });

      storageService.getSignedUrl.mockImplementation(async (key) => {
        if (key === testStorageKey) {
          return testSignedUrl;
        }
        throw new Error('Unexpected key in getSignedUrl');
      });

      // Mock fs operations for temp file handling
      const mockFs = require('fs');
      mockFs.promises.writeFile.mockImplementation(async (path, data) => {
        if (data === mockVideoBuffer) return;
        throw new Error('Unexpected data in writeFile');
      });

      // Initial assembly request
      const response = await request(app)
        .post('/assemble')
        .send({
          jobId: testJobId,
          templateId: testTemplateId
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'processing',
        assemblyId: testAssemblyId,
        jobId: testJobId
      });

      // Simulate processing webhook
      const processingWebhook = await request(app)
        .post('/webhook')
        .send({
          id: testCreatomateId,
          status: 'processing',
          metadata: JSON.stringify({
            assemblyId: testAssemblyId,
            jobId: testJobId,
            templateId: testTemplateId
          })
        });

      expect(processingWebhook.status).toBe(200);

      // Mock job data for completion
      const jobDataAccess = require('../../backend/services/job-service/data/jobDataAccess');
      jobDataAccess.getJob.mockResolvedValue({
        job_id: testJobId,
        status: 'processing',
        metadata: {
          scenes: [{ image: { publicUrl: 'test-url' } }],
          llmResult: { scenes: [{ description: 'test description' }] }
        }
      });

      // Simulate completion webhook with video metadata
      const completionWebhook = await request(app)
        .post('/webhook')
        .send({
          id: testCreatomateId,
          status: 'succeeded',
          metadata: JSON.stringify({
            assemblyId: testAssemblyId,
            jobId: testJobId,
            templateId: testTemplateId
          }),
          url: testSignedUrl,
          duration: 30,
          width: 1080,
          height: 1920,
          frame_rate: 30,
          file_size: 1024000
        });

      expect(completionWebhook.status).toBe(200);
      expect(completionWebhook.body).toMatchObject({
        status: 'completed',
        assemblyId: testAssemblyId,
        jobId: testJobId,
        templateId: testTemplateId,
        creatomateId: testCreatomateId,
        metadata: {
          duration: 30,
          resolution: '1080x1920',
          frameRate: 30
        }
      });

      // Verify database was updated correctly
      expect(assemblyDataAccess.updateAssemblyOutput).toHaveBeenCalledWith(
        testAssemblyId,
        expect.objectContaining({
          status: 'completed',
          storage_key: testStorageKey,
          public_url: testSignedUrl,
          creatomate_id: testCreatomateId,
          template_id: testTemplateId,
          metadata: expect.objectContaining({
            duration: 30,
            resolution: {
              width: 1080,
              height: 1920
            },
            frameRate: 30,
            fileSize: 1024000
          })
        })
      );
    });

    /**
     * Test Case 2: Render Failure Handling
     * 
     * Tests the error handling when video rendering fails:
     * 1. Initial assembly request succeeds
     * 2. Webhook reports render failure
     * 
     * Verifies:
     * - Error status is properly set
     * - Error details are stored in metadata
     * - Appropriate error response is sent
     */
    it('should handle render failure gracefully', async () => {
      // Mock initial successful response for assembly creation
      assemblyServiceInterface.generateContent.mockResolvedValue({
        status: 'processing',
        assemblyId: testCreatomateId,
        jobId: testJobId,
        templateId: testTemplateId
      });

      // Step 1: Initialize assembly
      const assemblyResponse = await request(app)
        .post('/assemble')
        .send({
          jobId: testJobId,
          templateId: testTemplateId
        });

      expect(assemblyResponse.status).toBe(200);
      const assemblyId = assemblyResponse.body.assemblyId;

      // Step 2: Simulate failed webhook
      const failedWebhook = await request(app)
        .post('/webhook')
        .send({
          id: testCreatomateId,
          status: 'failed',
          error: 'Render failed due to invalid template',
          metadata: JSON.stringify({
            assemblyId,
            jobId: testJobId,
            templateId: testTemplateId
          })
        });

      expect(failedWebhook.status).toBe(200);
      expect(failedWebhook.body).toMatchObject({
        status: 'failed',
        assemblyId,
        error: 'Render failed due to invalid template'
      });

      // Verify error status update in database
      expect(assemblyDataAccess.updateAssemblyOutput).toHaveBeenLastCalledWith(
        assemblyId,
        expect.objectContaining({
          status: 'failed',
          creatomate_id: testCreatomateId,
          metadata: expect.objectContaining({
            error: 'Render failed due to invalid template',
            stage: 'creatomate_render'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    /**
     * Test Case 3: Missing Parameters Validation
     * 
     * Tests input validation for the assembly endpoint:
     * - Attempts to create assembly without required parameters
     * 
     * Verifies:
     * - 400 status code is returned
     * - Appropriate error message is included
     */
    it('should handle missing required parameters', async () => {
      const response = await request(app)
        .post('/assemble')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required parameters');
    });

    /**
     * Test Case 4: Invalid Webhook Metadata
     * 
     * Tests webhook validation:
     * - Attempts to process webhook without required assemblyId in metadata
     * 
     * Verifies:
     * - 400 status code is returned
     * - Appropriate error message is included
     * - No database updates are performed
     */
    it('should handle missing assemblyId in webhook', async () => {
      const response = await request(app)
        .post('/webhook')
        .send({
          id: 'test-id',
          status: 'succeeded',
          metadata: JSON.stringify({})
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing assemblyId in metadata');
      expect(assemblyDataAccess.updateAssemblyOutput).not.toHaveBeenCalled();
    });
  });
}); 