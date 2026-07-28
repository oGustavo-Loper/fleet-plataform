import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8)
});

export const vehicleSchema = z.object({
  plate: z.string().min(7).max(8),
  brand: z.string().min(2),
  model: z.string().min(2),
  year: z.number().int().min(1900),
  fuelType: z.enum([
    "GASOLINE",
    "ETHANOL",
    "DIESEL",
    "FLEX",
    "ELECTRIC",
    "HYBRID"
  ]),
  currentKm: z.number().nonnegative(),
  ownerName: z.string().min(2)
});

export const syncQueueItemSchema = z.object({
  id: z.string().uuid(),
  operationId: z.string().uuid(),
  entity: z.enum(["vehicle", "odometer", "fuel", "maintenance"]),
  operation: z.enum(["create", "update"]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  status: z.enum(["pending", "processing", "synced", "conflict"])
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type SyncQueueItemInput = z.infer<typeof syncQueueItemSchema>;
