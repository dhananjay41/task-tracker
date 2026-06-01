import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Team Task Tracker API',
      version: '1.0.0',
      description: `
## Team Task Tracker REST API

A full-stack task management API with Role-Based Access Control (RBAC), JWT authentication, Redis caching, and real-time Socket.io notifications.

### Roles
- **ADMIN** — Full access to all resources
- **MANAGER** — Can create/delete tasks, view analytics
- **MEMBER** — Can only view and update tasks assigned to them

### Authentication
Use the \`/api/auth/login\` endpoint to obtain a JWT access token, then include it in the \`Authorization: Bearer <token>\` header for all protected endpoints.
      `,
      contact: {
        name: 'Team Task Tracker',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'MEMBER'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] },
            assigneeId: { type: 'string', format: 'uuid' },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { '$ref': '#/components/schemas/User' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'integer' },
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Tasks', description: 'Task management endpoints' },
      { name: 'Analytics', description: 'Analytics & reporting (ADMIN/MANAGER only)' },
    ],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' },
                    role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'MEMBER'], default: 'MEMBER' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/AuthTokens' },
                },
              },
            },
            400: { description: 'Validation error', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
            409: { description: 'Email already exists', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: { 'application/json': { schema: { '$ref': '#/components/schemas/AuthTokens' } } },
            },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token using a refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Token refreshed successfully',
              content: { 'application/json': { schema: { '$ref': '#/components/schemas/AuthTokens' } } },
            },
            400: { description: 'Refresh token required' },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/api/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'List tasks with optional filters and pagination',
          description: 'MEMBER role can only see tasks assigned to them. ADMIN/MANAGER can see all tasks and filter by assignee.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } },
            { name: 'assigneeId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by assignee (ADMIN/MANAGER only)' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'Tasks retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tasks: { type: 'array', items: { '$ref': '#/components/schemas/Task' } },
                      pagination: { '$ref': '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          tags: ['Tasks'],
          summary: 'Create a new task',
          description: 'Only ADMIN and MANAGER can create tasks.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'assigneeId'],
                  properties: {
                    title: { type: 'string', example: 'Fix login bug' },
                    description: { type: 'string', example: 'Users cannot login with Google SSO' },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
                    assigneeId: { type: 'string', format: 'uuid' },
                    dueDate: { type: 'string', format: 'date-time', example: '2026-12-31T00:00:00.000Z' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Task created successfully', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Task' } } } },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden — insufficient role' },
          },
        },
      },
      '/api/tasks/{id}': {
        put: {
          tags: ['Tasks'],
          summary: 'Update a task',
          description: 'MEMBER can only update tasks assigned to them. Status transitions follow a strict state machine: TODO → IN_PROGRESS → IN_REVIEW → DONE. BLOCKED can be reached from any state.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] },
                    assigneeId: { type: 'string', format: 'uuid' },
                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Task updated successfully', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Task' } } } },
            400: { description: 'Validation error or invalid status transition' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Task not found' },
          },
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Delete a task',
          description: 'Only ADMIN and MANAGER can delete tasks.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            204: { description: 'Task deleted successfully' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden — insufficient role' },
            404: { description: 'Task not found' },
          },
        },
      },
      '/api/analytics': {
        get: {
          tags: ['Analytics'],
          summary: 'Get team analytics',
          description: 'Returns overdue task counts and completion efficiency metrics. Only accessible by ADMIN and MANAGER.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Analytics data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      overdueCount: { type: 'integer', description: 'Number of tasks past their due date and not done' },
                      completedCount: { type: 'integer', description: 'Total completed tasks' },
                      totalTasks: { type: 'integer' },
                      efficiencyRate: { type: 'number', description: 'Ratio of completed tasks to total tasks (0-1)' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden — ADMIN/MANAGER only' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
