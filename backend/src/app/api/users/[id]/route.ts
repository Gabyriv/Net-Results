import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import bcrypt from "bcryptjs";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { UserUpdateSchema } from "@/app/api/types/types";
import supabase from "@/config/supabase_client";
import { withAuth } from "@/utils/auth-utils";

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
 * 
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves a single user by their ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
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
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    console.log('GET /api/users/[id] - Starting request for ID:', params.id);
    
    return withAuth(request, async (session) => {
        console.log('GET /api/users/[id] - Authenticated with session:', JSON.stringify(session));
        
        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid user ID' },
                    { status: 400 }
                );
            }
            
            // Users can only view their own profile unless they're a Manager
            if (session.userId !== params.id && session.userRole !== 'Manager') {
                console.log('GET /api/users/[id] - Access denied: User ID mismatch and not a Manager');
                return NextResponse.json(
                    { error: 'You do not have permission to view this user' },
                    { status: 403 }
                );
            }

            const user = await prisma.user.findUnique({
                where: { id: params.id },
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    role: true
                }
            });

            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: user }, { status: 200 });
        } catch (error) {
            return handleServerError(error)
        }
    });
}

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: Updates a user by their ID with the provided information
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Manager, Player]
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *       404:
 *         description: User not found
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
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    console.log('PUT /api/users/[id] - Starting request for ID:', params.id);
    
    return withAuth(request, async (session) => {
        console.log('PUT /api/users/[id] - Authenticated with session:', JSON.stringify(session));
        
        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid user ID' },
                    { status: 400 }
                );
            }
            
            // Users can only update their own profile unless they're a Manager
            if (session.userId !== params.id && session.userRole !== 'Manager') {
                console.log('PUT /api/users/[id] - Access denied: User ID mismatch and not a Manager');
                return NextResponse.json(
                    { error: 'You do not have permission to update this user' },
                    { status: 403 }
                );
            }

            try {
                const body = await request.json();
                const validated = UserUpdateSchema.safeParse(body);
                
                if (!validated.success) {
                    return NextResponse.json(
                        { error: 'Invalid data format', details: validated.error.format() },
                        { status: 400 }
                    );
                }
                
                // Only Managers can change roles
                if (validated.data.role && session.userRole !== 'Manager') {
                    console.log('PUT /api/users/[id] - Access denied: Role change attempted by non-Manager');
                    return NextResponse.json(
                        { error: 'Only managers can change user roles' },
                        { status: 403 }
                    );
                }

                let updatedData: Prisma.UserUpdateInput = validated.data;

                if (validated.data.password) {
                    const hashedPassword = await bcrypt.hash(validated.data.password, 12);
                    updatedData = { ...validated.data, password: hashedPassword };

                    // Update password in Supabase
                    const { error: supabaseError } = await supabase.auth.admin.updateUserById(
                        params.id,
                        { password: validated.data.password }
                    );

                    if (supabaseError) {
                        return handleServerError(supabaseError);
                    }
                }

                const user = await prisma.user.update({
                    where: { id: params.id },
                    data: updatedData,
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        role: true,
                    }
                });

                // Update Supabase user metadata if displayName or role changes
                if (validated.data.displayName || validated.data.role) {
                    await supabase.auth.admin.updateUserById(params.id, {
                        user_metadata: {
                            displayName: validated.data.displayName,
                            role: validated.data.role
                        }
                    });
                }

                return NextResponse.json({ success: true, data: user }, { status: 200 });
            } catch (error) {
                return handleServerError(error);
            }
        } catch (error) {
            return handleServerError(error);
        }
    });
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     description: Deletes a user by their ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully
 *         content: {}
 *       404:
 *         description: User not found
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
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    console.log('DELETE /api/users/[id] - Starting request for ID:', params.id);
    
    return withAuth(request, async (session) => {
        console.log('DELETE /api/users/[id] - Authenticated with session:', JSON.stringify(session));
        
        try {
            // Validate the ID parameter
            if (!params.id || typeof params.id !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid user ID' },
                    { status: 400 }
                );
            }
            
            // Only Managers can delete users
            if (session.userRole !== 'Manager') {
                console.log('DELETE /api/users/[id] - Access denied: User is not a Manager');
                return NextResponse.json(
                    { error: 'User not allowed', details: 'Only Managers can delete users' },
                    { status: 403 }
                );
            }

            // Check if the user exists
            const userToDelete = await prisma.user.findUnique({
                where: { id: params.id },
                include: {
                    manager: true,
                    player: true
                }
            });

            if (!userToDelete) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // Prevent deleting the last manager
            if (userToDelete.role === 'Manager') {
                const managerCount = await prisma.user.count({
                    where: { role: 'Manager' }
                });
                
                if (managerCount <= 1) {
                    return NextResponse.json(
                        { error: 'Cannot delete the last manager account' },
                        { status: 403 }
                    );
                }
            }

            // Delete related records first
            if (userToDelete.manager) {
                // Check if manager has teams
                const teamsCount = await prisma.team.count({
                    where: { managerId: userToDelete.manager.id }
                });
                
                if (teamsCount > 0) {
                    // Delete or reassign teams first
                    return NextResponse.json(
                        { error: 'Cannot delete manager with associated teams', details: 'Please delete or reassign teams first' },
                        { status: 409 }
                    );
                }
                
                // Delete manager record
                await prisma.manager.delete({
                    where: { id: userToDelete.manager.id }
                });
            }

            if (userToDelete.player) {
                // Delete player record
                await prisma.player.delete({
                    where: { id: userToDelete.player.id }
                });
            }

            // Delete user from database
            await prisma.user.delete({
                where: { id: params.id }
            });

            // In development mode, we skip Supabase auth deletion
            // In production, you would uncomment this:
            /*
            const { error: supabaseError } = await supabase.auth.admin.deleteUser(params.id);
            if (supabaseError) {
                return handleServerError(supabaseError);
            }
            */

            return NextResponse.json({ success: true }, { status: 200 });
        } catch (error) {
            console.error('Error deleting user:', error);
            return handleServerError(error);
        }
    });
}
