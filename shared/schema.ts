import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// BART Train Arrival Schema for API responses
export const bartTrainArrivalSchema = z.object({
  destination: z.string(),
  abbreviation: z.string(),
  minutes: z.string(),
  platform: z.string(),
  direction: z.string(),
  length: z.string(),
  color: z.string(),
  hexcolor: z.string().optional(),
  delay: z.string().optional()
});

export const bartStationDataSchema = z.object({
  station: z.string(),
  abbreviation: z.string(),
  etd: z.array(z.object({
    destination: z.string(),
    abbreviation: z.string(),
    estimate: z.array(bartTrainArrivalSchema)
  }))
});

export const routeRecommendationSchema = z.object({
  type: z.enum(['direct', 'transfer']),
  totalTime: z.number(),
  timeSaved: z.number().optional(),
  etaAtDublin: z.string().optional(),
  steps: z.array(z.object({
    action: z.string(),
    station: z.string(),
    platform: z.string().optional(),
    waitTime: z.number().optional(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    transferTime: z.number().optional(),
    waitTimeAtStation: z.number().optional(),
    travelTime: z.number().optional()
  }))
});

export type BartTrainArrival = z.infer<typeof bartTrainArrivalSchema>;
export type BartStationData = z.infer<typeof bartStationDataSchema>;
export type RouteRecommendation = z.infer<typeof routeRecommendationSchema>;

// Keep existing user schema for template compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
