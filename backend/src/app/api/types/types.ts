"use client";

import { z } from "zod";

// Enum for Role
export const RoleEnum = z.enum(["Manager", "Player"]);
export type Role = z.infer<typeof RoleEnum>;

// User schemas
export const UserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  password: z.string(),
  displayName: z.string().min(2, "Display name must be at least 2 characters long").max(50),
  role: RoleEnum.default("Player"),
  managerId: z.string().optional(),
  playerId: z.string().optional(),
});

export const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
  displayName: z.string().min(2).max(50).optional(),
  role: RoleEnum.optional(),
});

// Manager schemas
export const ManagerSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().min(2).max(50),
  userId: z.string(),
});

export const ManagerUpdateSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
});

// Team schemas
export const TeamSchema = z.object({
  name: z.string().min(2).max(50),
});

export const TeamUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
});

// Player schemas
export const PlayerSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().min(2).max(50),
  gamesPlayed: z.number().int().min(0).default(0),
  teamId: z.string(),
  userId: z.string().optional(),
});

export const PlayerUpdateSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  gamesPlayed: z.number().int().min(0).optional(),
  teamId: z.string().optional(),
});

// Game schemas
export const GameSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  location: z.string(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeTeamScore: z.number().int().default(0),
  awayTeamScore: z.number().int().default(0),
  status: z.enum(["scheduled", "in_progress", "completed"]).default("scheduled"),
});

export const GameUpdateSchema = z.object({
  date: z.string().optional(),
  location: z.string().optional(),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  homeTeamScore: z.number().int().optional(),
  awayTeamScore: z.number().int().optional(),
  status: z.enum(["scheduled", "in_progress", "completed"]).optional(),
});

// PlayerStat schemas
export const PlayerStatSchema = z.object({
  id: z.string().optional(),
  value: z.number(),
  created_at: z.date().optional().default(new Date()),
  dayOfGame: z.string(),
  playerId: z.string(),
  statId: z.number().int(),
});

export const PlayerStatUpdateSchema = z.object({
  value: z.number().optional(),
  dayOfGame: z.string().optional(),
});

// Stat schemas
export const StatSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const StatUpdateSchema = z.object({
  name: z.string().optional(),
});

// Type exports
export type UserCreateInput = z.infer<typeof UserSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type ManagerCreateInput = z.infer<typeof ManagerSchema>;
export type ManagerUpdateInput = z.infer<typeof ManagerUpdateSchema>;
export type TeamCreateInput = z.infer<typeof TeamSchema>;
export type TeamUpdateInput = z.infer<typeof TeamUpdateSchema>;
export type PlayerCreateInput = z.infer<typeof PlayerSchema>;
export type PlayerUpdateInput = z.infer<typeof PlayerUpdateSchema>;
export type GameCreateInput = z.infer<typeof GameSchema>;
export type GameUpdateInput = z.infer<typeof GameUpdateSchema>;
export type PlayerStatCreateInput = z.infer<typeof PlayerStatSchema>;
export type PlayerStatUpdateInput = z.infer<typeof PlayerStatUpdateSchema>;
export type StatCreateInput = z.infer<typeof StatSchema>;
export type StatUpdateInput = z.infer<typeof StatUpdateSchema>;
