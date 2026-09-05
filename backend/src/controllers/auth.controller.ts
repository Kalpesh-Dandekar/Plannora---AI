import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

function createToken(userId: string): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required but was not provided.");
  }

  return jwt.sign(
    { userId },
    jwtSecret,
    {
      expiresIn: "7d",
    },
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
      return;
    }

    if (name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and contain at least one number.",
      });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = createToken(user.id);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown registration error";

    console.error(`Registration failed: ${message}`);

    res.status(500).json({
      success: false,
      message: "Unable to create account right now.",
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const token = createToken(user.id);

    res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown login error";

    console.error(`Login failed: ${message}`);

    res.status(500).json({
      success: false,
      message: "Unable to sign in right now.",
    });
  }
}