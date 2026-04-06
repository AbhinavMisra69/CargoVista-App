"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  IconBrandGithub,
  IconBrandGoogle,
} from "@tabler/icons-react";

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sellerId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sellerId = Number(formData.sellerId);
      if (!Number.isFinite(sellerId)) {
        toast.error("Please enter a valid seller ID");
        return;
      }

      if (!formData.firstName || !formData.lastName) {
        toast.error("First name and last name are required");
        return;
      }

      const name = `${formData.firstName} ${formData.lastName}`.trim();

      // Create seller account
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          name,
          email: formData.email || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }

      // Auto-login after signup
      await login(sellerId);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      
      {/* ---------------- LEFT SIDE: THE FORM (Clean White) ---------------- */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-12 bg-white">
        <div className="mx-auto grid w-full max-w-md gap-6">
          
          {/* Mobile-only Logo (visible on small screens) */}
          <div className="lg:hidden flex items-center gap-2 mb-4 text-slate-900">
             <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
             </div>
             <span className="font-bold text-xl">CargoVista</span>
          </div>

          <Link href="/" className="mb-4 text-sm text-slate-600 hover:text-slate-900">
            ← Back to home
          </Link>

          <div className="grid gap-2 text-left">
            <h1 className="text-3xl font-bold text-slate-900">Create an account</h1>
            <p className="text-slate-500">
              Enter your information to get started with your shipment tracking.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              
              {/* Seller ID */}
              <LabelInputContainer>
                <Label className="text-sm font-medium text-slate-700" htmlFor="sellerId">Seller ID</Label>
                <Input
                  id="sellerId"
                  placeholder="123"
                  type="number"
                  value={formData.sellerId}
                  className=" text-slate-700"
                  onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                  required
                  disabled={loading}
                />
              </LabelInputContainer>

              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <LabelInputContainer>
                  <Label className="text-sm font-medium text-slate-700" htmlFor="firstname">First name</Label>
                  <Input
                    id="firstname"
                    placeholder="John"
                    type="text"
                    className=" text-slate-700"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </LabelInputContainer>
                <LabelInputContainer>
                  <Label className="text-sm font-medium text-slate-700"  htmlFor="lastname">Last name</Label>
                  <Input
                    id="lastname"
                    placeholder="Doe"
                    type="text"
                    className=" text-slate-700"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </LabelInputContainer>
              </div>

              {/* Email */}
              <LabelInputContainer>
                <Label className="text-sm font-medium text-slate-700"  htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  placeholder="seller@cargovista.com"
                  type="email"
                  className=" text-slate-700"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </LabelInputContainer>

              {/* MAIN ACTION BUTTON */}
              <button
                className="group/btn relative block h-11 w-full rounded-md bg-slate-900 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="mr-2" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    Sign up &rarr;
                    <BottomGradient />
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* SOCIAL BUTTONS */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="group/btn relative flex h-10 w-full items-center justify-center space-x-2 rounded-md border border-slate-200 bg-white px-4 font-medium text-slate-900 transition-colors hover:bg-slate-50"
                  type="button"
                >
                  <IconBrandGithub className="h-4 w-4" />
                  <span className="text-sm">GitHub</span>
                  <BottomGradient />
                </button>
                <button
                  className="group/btn relative flex h-10 w-full items-center justify-center space-x-2 rounded-md border border-slate-200 bg-white px-4 font-medium text-slate-900 transition-colors hover:bg-slate-50"
                  type="button"
                >
                  <IconBrandGoogle className="h-4 w-4" />
                  <span className="text-sm">Google</span>
                  <BottomGradient />
                </button>
              </div>

            </div>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------- RIGHT SIDE: VISUAL PANEL ---------------- */}
<div
  className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden bg-cover bg-center"
  style={{ backgroundImage: "url('/signup.jpg')" }}
>

  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-black/55" />

  {/* Branding Top Left */}
  <div className="relative z-10 flex items-center gap-2 text-lg font-medium">
    <div className="h-8 w-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </div>
    CargoVista
  </div>

  {/* Hero Text */}
  <div className="relative z-10 mt-auto max-w-md">
    <blockquote className="space-y-2">
      <p className="text-lg font-medium leading-relaxed">
        &ldquo;The most reliable platform for modern logistics. CargoVista gives us the visibility we need to keep our fleet moving across India;
      </p>
      
    </blockquote>
  </div>

  {/* Soft Glow */}
  <div className="absolute bottom-[-150px] right-[-150px] w-[350px] h-[350px] bg-blue-500/20 rounded-full blur-[120px]" />
</div>
    </div>
  );
}

// --- Internal Helper Components (Preserved for Animation) ---

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};