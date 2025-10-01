"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { User, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GradientButton from "@/components/ui/GradientButton";
import MathSymbols from "@/components/floating/MathSymbols";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

// Define the validation schema with Zod
const loginSchema = z.object({
  identifier: z.string().min(1, "Roll No or Email is required"),
  password: z.string().min(1, "Password is required"),
});

// Infer the TypeScript type from the schema
type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      identifier: data.identifier, // Use 'identifier' here
      password: data.password,
    });
    setIsLoading(false);

    if (result?.error) {
      toast.error(result.error); // Show error toast
    } else if (result?.ok) {
      toast.success("Login Successful!"); // Show success toast
      router.push("/"); // Redirect on success
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-blue/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary-purple/10 rounded-full blur-[100px]" />
      </div>

      <MathSymbols />
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 min-h-[calc(100vh-8rem)]">
        <div className="max-w-md w-full">
          <div className="backdrop-blur-xl bg-black/30 p-8 rounded-2xl border border-gray-800 shadow-xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-blue via-primary-cyan to-primary-purple">
                Welcome Back
              </h2>
              <p className="mt-2 text-gray-400">Sign in to your account</p>
            </div>

            {/* This form is now controlled by React Hook Form */}
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="identifier" // Changed from roll-number
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Roll Number / Email {/* Changed label text */}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="identifier" // Changed from roll-number
                      type="text"
                      required
                      className="block w-full pl-10 px-3 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue/50 text-white placeholder-gray-500"
                      placeholder="Enter your roll number or email" // Changed placeholder
                      {...register("identifier")} // This connects the input to React Hook Form
                    />
                  </div>
                  {/* Display validation errors from Zod */}
                  {errors.identifier && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.identifier.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      className="block w-full pl-10 px-3 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue/50 text-white placeholder-gray-500"
                      placeholder="Enter your password"
                      {...register("password")} // This connects the input to React Hook Form
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <GradientButton
                  type="submit"
                  className="w-full justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </GradientButton>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/register"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Don't have an account?&nbsp;&nbsp;&nbsp;
              </Link>
              <Link
                href="/forget-password"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Reset Password!
              </Link>
            </div>
          </div>
        </div>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
