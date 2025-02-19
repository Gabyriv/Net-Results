import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/config/prisma";
import bcrypt from "bcryptjs";
import { handleServerError } from "@/app/api/errors_handlers/errors";
import { UserUpdateSchema } from "../../types/types";
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
    return withAuth(async (session) => {
        try {
            // Users can only view their own profile unless they're an admin
            if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to view this user' },
                    { status: 403 }
                );
            }

            const user = await prisma.user.findUnique({
                where: { id: params.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    createdTeams: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: ^[a-zA-Z]+$
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
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
    return withAuth(async (session) => {
        try {
            // Users can only update their own profile unless they're an admin
            if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'You do not have permission to update this user' },
                    { status: 403 }
                );
            }

            const body = await request.json();
            const validated = UserUpdateSchema.parse(body);

            // Only admins can change roles
            if (validated.role && session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'Only administrators can change user roles' },
                    { status: 403 }
                );
            }

            let updatedData: Prisma.UserUpdateInput = validated;

            if (validated.password) {
                const hashedPassword = await bcrypt.hash(validated.password, 12);
                updatedData = { ...validated, password: hashedPassword };

                // Update password in Supabase
                const { error: supabaseError } = await supabase.auth.admin.updateUserById(
                    params.id,
                    { password: validated.password }
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
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    createdTeams: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            // Update Supabase user metadata if name or role changes
            if (validated.name || validated.role) {
                await supabase.auth.admin.updateUserById(params.id, {
                    user_metadata: {
                        name: validated.name,
                        role: validated.role
                    }
                });
            }

            return NextResponse.json({ success: true, data: user }, { status: 200 });
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
    return withAuth(async (session) => {
        try {
            // Only admins can delete users
            if (session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'Only administrators can delete users' },
                    { status: 403 }
                );
            }

            // Prevent deleting the last admin
            if (session.user.id === params.id) {
                const adminCount = await prisma.user.count({
                    where: { role: 'ADMIN' }
                });
                
                if (adminCount <= 1) {
                    return NextResponse.json(
                        { error: 'Cannot delete the last administrator account' },
                        { status: 403 }
                    );
                }
            }

            // Delete user from database
            await prisma.user.delete({
                where: { id: params.id }
            });

            // Delete user from Supabase
            const { error: supabaseError } = await supabase.auth.admin.deleteUser(params.id);

            if (supabaseError) {
                return handleServerError(supabaseError);
            }

            return new NextResponse(null, { status: 204 });
        } catch (error) {
            return handleServerError(error);
        }
    }, 'ADMIN');
}
