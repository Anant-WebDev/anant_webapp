"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  BookOpen,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { InputField } from "./InputField";
import toast from "react-hot-toast";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!identifier) {
      toast.error("Please enter a roll number or email to verify.");
      return;
    }

    setIsVerifying(true);
    const toastId = toast.loading("Sending verification code...");

    try {
      // --- CHANGE #1: This now calls the main register route ---
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // It sends an 'action' to tell the backend what to do
        body: JSON.stringify({
          action: "send-code",
          identifier: identifier,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      toast.success("Verification code sent!", { id: toastId });
      setOtpSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred", {
        id: toastId,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!otpSent) {
      toast.error("Please verify your email or roll number first.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Creating your account...");

    try {
      // --- CHANGE #2: This also calls the main register route ---
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // It sends a different 'action' and the full form data
        body: JSON.stringify({
          action: "create-user",
          name: name,
          identifier: identifier,
          password: password,
          confirmpassword: confirmPassword,
          otp: otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("Account created successfully! Please log in.", {
        id: toastId,
      });
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-black/40 p-8 rounded-2xl border border-gray-800 shadow-2xl mt-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-blue via-primary-cyan to-primary-purple">
          Create Account
        </h2>
        <p className="mt-2 text-gray-400">Join The Mathematical Society</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <InputField
            id="name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<UserCircle2 className="h-5 w-5 text-gray-500" />}
            placeholder="Enter your full name"
            disabled={isLoading || isVerifying}
          />

          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Roll Number / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpen className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full pl-10 pr-24 py-2.5 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue/50 text-white placeholder-gray-500 transition-colors"
                placeholder="Enter to verify"
                required
                disabled={isLoading || isVerifying || otpSent}
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={
                  isLoading || isVerifying || otpSent || identifier.length === 0
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-blue/20 hover:bg-primary-blue/30 text-primary-blue rounded-md transition-colors duration-200 disabled:opacity-50"
              >
                {isVerifying ? "Sending..." : otpSent ? "Sent" : "Verify"}
              </button>
            </div>
          </div>

          {otpSent && (
            <InputField
              id="otp"
              label="Verification Code"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              icon={<ShieldCheck className="h-5 w-5 text-gray-500" />}
              placeholder="Enter the code sent to your email"
              disabled={isLoading}
            />
          )}

          <InputField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<KeyRound className="h-5 w-5 text-gray-500" />}
            placeholder="Enter your password"
            disabled={isLoading}
          />

          <InputField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="h-5 w-5 text-gray-500" />}
            placeholder="Confirm your password"
            disabled={isLoading}
          />
        </div>

        <div className="pt-2">
          <GradientButton
            type="submit"
            className="w-full py-2.5 justify-center"
            disabled={isLoading || !otpSent}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </GradientButton>
        </div>
      </form>
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Already have an account?{" "}
          <span className="text-primary-cyan hover:text-primary-blue transition-colors">
            Sign in
          </span>
        </Link>
      </div>
    </div>
  );
}
