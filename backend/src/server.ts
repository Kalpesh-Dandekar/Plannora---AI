import "dotenv/config";

import app from "./app.js";
import { connectToDatabase } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  try {
    await connectToDatabase();

    app.listen(port, () => {
      console.log(`API server is listening on port ${port}.`);
    });
  } catch {
    console.error("API server could not start.");
    process.exit(1);
  }
}

void startServer();
