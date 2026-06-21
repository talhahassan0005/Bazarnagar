import mongoose from "mongoose";
import { env } from "../config/env";

/** Connect to MongoDB. Throws on failure so the caller can exit the process. */
export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log(`✓ MongoDB connected: ${mongoose.connection.name}`);
}
