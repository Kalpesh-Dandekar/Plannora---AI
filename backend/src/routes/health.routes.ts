import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "AI Study Planner API is running",
  });
});

export default healthRouter;
