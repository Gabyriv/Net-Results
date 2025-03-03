// config/swagger.ts
export const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'User API',
        version: '1.0.0',
        description: 'API Documentation'
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Development server'
        }
    ],
    paths: {
        '/api/users': {
            post: {
                summary: 'Create a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'password', 'role'],
                                properties: {
                                    name: {
                                        type: 'string',
                                        minLength: 2,
                                        maxLength: 50
                                    },
                                    email: {
                                        type: 'string',
                                        format: 'email'
                                    },
                                    password: {
                                        type: 'string',
                                        minLength: 8
                                    },
                                    role: {
                                        type: 'string',
                                        enum: ['admin', 'user']
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'User created successfully'
                    },
                    400: {
                        description: 'Invalid input'
                    },
                    500: {
                        description: 'Server error'
                    }
                }
            }
        }
    }
}
