import { z } from "zod";

// User schemas
export const UserSchema = z.object({
    name: z.string().min(2).max(50).regex(/^[a-zA-Z]+$/),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["ADMIN", "USER"]).default("USER")
});

export const UserUpdateSchema = z.object({
    name: z.string().min(2).max(50).regex(/^[a-zA-Z]+$/).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.enum(["ADMIN", "USER"]).optional()
});

// Team schemas
export const TeamSchema = z.object({
    name: z.string().min(2).max(50),
    players: z.array(z.string()).optional().default([]),
    gamesPlayed: z.number().min(0).default(0),
    wins: z.number().min(0).default(0),
    losses: z.number().min(0).default(0),
    draws: z.number().min(0).default(0)
});

export const TeamUpdateSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    gamesPlayed: z.number().min(0).optional(),
    wins: z.number().min(0).optional(),
    losses: z.number().min(0).optional(),
    draws: z.number().min(0).optional()
});

// Player schemas
export const PlayerSchema = z.object({
    name: z.string().min(2).max(50),
    number: z.number().int().min(0).max(99),
    teamId: z.string().uuid()
});

export const PlayerUpdateSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    number: z.number().int().min(0).max(99).optional(),
    teamId: z.string().uuid().optional()
});

// Game schemas
export const GameSchema = z.object({
    teamId: z.string().uuid(),
    opponent: z.string().min(2).max(50).regex(/^[a-zA-Z0-9]+$/),
    result: z.enum(["Win", "Loss", "Draw"]).default("Draw")
});

export const GameUpdateSchema = z.object({
    opponent: z.string().min(2).max(50).optional(),
    result: z.enum(["Win", "Loss", "Draw"]).optional()
});

// Stats schemas
export const StatsTypeEnum = z.enum(["Serve", "Attack", "Defense", "Pass"]);
export const StatsResultEnum = z.enum(["Success", "Failure", "Neutral"]);

// Type exports
export type UserCreateInput = z.infer<typeof UserSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type TeamCreateInput = z.infer<typeof TeamSchema>;
export type TeamUpdateInput = z.infer<typeof TeamUpdateSchema>;
export type PlayerCreateInput = z.infer<typeof PlayerSchema>;
export type PlayerUpdateInput = z.infer<typeof PlayerUpdateSchema>;
export type GameCreateInput = z.infer<typeof GameSchema>;
export type GameUpdateInput = z.infer<typeof GameUpdateSchema>;
export type StatsType = z.infer<typeof StatsTypeEnum>;
export type StatsResult = z.infer<typeof StatsResultEnum>;
