import mongoose from "mongoose";

export async function connectToDatabase(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error("MONGODB_URI is required but was not provided.");
  }

  try {
    await mongoose.connect(mongodbUri, {
      dbName: "plannora",
    });

    console.log("MongoDB connected successfully.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown MongoDB connection error";

    console.error(`MongoDB connection failed: ${message}`);
    throw error;
  }
}