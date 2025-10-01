import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/PrismaClient/db";
import bcryptjs from "bcryptjs";
import redis from "@/helpers/redis";
import { z } from "zod";
import sendEmail from "@/helpers/mailer";
import { mailOptions } from "@/helpers/mailer";
import {
  branch_options,
  club_dept_options,
  position_options,
} from "@prisma/client";
import fs from "fs";
import path from "path";

// --- Zod Schemas for Each Action ---
const sendCodeSchema = z.object({
  action: z.literal("send-code"),
  identifier: z.string().min(1, "Identifier is required"),
});

const createUserSchema = z
  .object({
    action: z.literal("create-user"),
    identifier: z.string().min(1, "Identifier is required"),
    name: z.string().min(1, "Username is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmpassword: z.string(),
    otp: z.string().min(6, "OTP must be 6 characters"),
  })
  .refine((data) => data.password === data.confirmpassword, {
    message: "Passwords do not match",
    path: ["confirmpassword"],
  });

// --- Your existing CSV parser ---
async function parseCSV(rno: number) {
  // ... (your existing parseCSV function is fine)
  const filePath = path.join(process.cwd(), "src/data/admins.csv");
  const csvData = fs.readFileSync(filePath, "utf8");
  const rows = csvData
    .replace(/\r/g, "")
    .split("\n")
    .map((row) => row.split(","));
  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === rno.toString()) {
      return Object.fromEntries(headers.map((h, idx) => [h, row[idx]]));
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // ==========================================================
    //  STEP 1: LOGIC FOR SENDING THE VERIFICATION CODE
    // ==========================================================
    if (action === "send-code") {
      const result = sendCodeSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0].message },
          { status: 400 },
        );
      }

      const { identifier } = result.data;
      const isEmail = identifier.includes("@");
      let user, emailToSendTo: string;

      // Check if user already exists
      if (isEmail) {
        user = await prisma.user.findUnique({ where: { email: identifier } });
        emailToSendTo = identifier;
      } else {
        if (!/^\d+$/.test(identifier))
          return NextResponse.json(
            { error: "Invalid Roll Number" },
            { status: 400 },
          );
        user = await prisma.user.findUnique({
          where: { roll_number: Number(identifier) },
        });
        emailToSendTo = identifier + "@nitkkr.ac.in";
      }

      if (user) {
        return NextResponse.json(
          { error: "User already registered" },
          { status: 409 },
        );
      }

      // Generate, hash, and store OTP in Redis
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const salt = await bcryptjs.genSalt(10);
      const hashedOTP = await bcryptjs.hash(otp, salt);
      await redis.set(
        identifier,
        JSON.stringify({ hashedOTP, time: Date.now() }),
      );
      await redis.expire(identifier, 600); // 10-minute expiry

      // Send the email
      await sendEmail({
        from: process.env.MAIL_ID!,
        to: emailToSendTo,
        subject: "Anant Registration: Your Verification Code",
        text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
      });

      return NextResponse.json({ message: "Verification code sent." });
    }

    // ==========================================================
    //  STEP 2: LOGIC FOR CREATING THE USER
    // ==========================================================
    else if (action === "create-user") {
      const result = createUserSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0].message },
          { status: 400 },
        );
      }

      const { identifier, name, password, otp } = result.data;
      const isEmail = identifier.includes("@");

      // Verify the OTP from Redis
      const redisValue = await redis.get(identifier);
      if (!redisValue) {
        return NextResponse.json(
          { error: "Verification expired or not initiated." },
          { status: 400 },
        );
      }

      const { hashedOTP, time } = JSON.parse(redisValue);
      if (Date.now() - time > 600000) {
        return NextResponse.json(
          { error: "OTP has expired." },
          { status: 400 },
        );
      }

      const isOtpCorrect = await bcryptjs.compare(otp, hashedOTP);
      if (!isOtpCorrect) {
        return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
      }

      await redis.del(identifier); // OTP is used, so delete it

      // Hash password and create user data
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      let userData: any = {
        name: name,
        password: hashedPassword,
        email: isEmail ? identifier : null,
        roll_number: isEmail ? null : Number(identifier),
      };

      if (!isEmail) {
        const user_details = await parseCSV(Number(identifier));
        if (user_details) {
          userData.batch = user_details["batch"];
          userData.branch = user_details["branch"] as branch_options;
          userData.position = user_details["position"] as position_options;
          userData.club_dept = [user_details["club_dept"] as club_dept_options];
        }
      }

      await prisma.user.create({ data: userData });

      return NextResponse.json(
        { message: "Registration successful!" },
        { status: 201 },
      );
    }

    // If no valid action is provided
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.log("Error in registration: ", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
