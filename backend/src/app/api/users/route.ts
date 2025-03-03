import { NextResponse } from "next/server";
import { prisma } from "../../../config/prisma";
import bcrypt from "bcryptjs";
import { handleServerError } from "../errors_handlers/errors";
import { UserSchema } from "../types/types";
import { withAuth } from "../../../utils/auth-utils";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         details:
 *           oneOf:
 *             - type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   message:
 *                     type: string
 *                   path:
 *                     type: array
 *                     items:
 *                       type: string
 *             - type: string
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             displayName:
 *               type: string
 *             role:
 *               type: string
 *               enum: [Manager, Player]
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with the provided information
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               role:
 *                 type: string
 *                 enum: [Manager, Player]
 *                 default: Player
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
*/
export async function POST(request: Request) {
    // No auth required for user registration
    try {
        const body = await request.json();
        const validated = UserSchema.parse(body);

        try {
            console.log('Attempting to sign up user with email:', validated.email);
            
            // First check if the user already exists in Prisma
            const existingUser = await prisma.user.findUnique({
                where: { email: validated.email }
            });
            
            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email already exists' },
                    { status: 409 }
                );
            }
            
            // For testing purposes, we'll bypass Supabase auth and create the user directly in Prisma
            // This is just for development/testing - in production, you would use Supabase auth
            try {
                const hashedPassword = await bcrypt.hash(validated.password, 12);
                
                // Generate a UUID for the user ID (simulating what Supabase would do)
                const userId = crypto.randomUUID();
                
                // Determine the role
                const role = validated.role ? (validated.role === "Manager" ? "Manager" : "Player") : "Player";
                
                // Create the user
                const user = await prisma.user.create({
                    data: {
                        id: userId,
                        email: validated.email,
                        password: hashedPassword,
                        displayName: validated.displayName,
                        role: role
                    },
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        role: true
                    }
                });
                
                // If the user is a Manager, create a Manager record
                if (role === "Manager") {
                    try {
                        const managerId = uuidv4();
                        
                        // Create the Manager record
                        await prisma.manager.create({
                            data: {
                                id: managerId,
                                displayName: validated.displayName,
                                user: {
                                    connect: { id: userId }
                                }
                            }
                        });
                        
                        // Update the user with the managerId
                        await prisma.user.update({
                            where: { id: userId },
                            data: {
                                managerId: managerId
                            }
                        });
                        
                        console.log(`Created Manager record with ID ${managerId} for user ${userId}`);
                    } catch (managerError) {
                        console.error('Error creating Manager record:', managerError);
                        // We've already created the user, so we'll just log the error and continue
                    }
                }
                
                return NextResponse.json({ 
                    success: true, 
                    data: user,
                    message: 'User created successfully. In a production environment, email verification would be required.'
                }, { status: 201 });
            } catch (prismaError) {
                console.error('Error creating user in Prisma:', prismaError);
                return handleServerError(prismaError);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            return handleServerError(error);
        }
    } catch (error) {
        return handleServerError(error)
    }
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a list of all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request: Request) {
    return withAuth(request, async (session) => {
        try {
            // Only Managers can get all users
            if (session.userRole !== 'Manager') {
                return NextResponse.json(
                    { error: 'Forbidden - Manager access required' },
                    { status: 403 }
                );
            }

            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    role: true,
                    manager: true,
                    player: true
                }
            });
            
            return NextResponse.json({ success: true, data: users }, { status: 200 });
        } catch (error) {
            return handleServerError(error);
        }
    });
}

const UsersComponent = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default UsersComponent;
