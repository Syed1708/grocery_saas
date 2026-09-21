"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, User, Mail, Lock, Phone, ArrowRight, Loader2 } from "lucide-react";
import { registerStoreAction } from "@/app/actions/auth/register-action";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await registerStoreAction(formData);

    setLoading(false);

    if (res.success) {
      router.push("/login?registered=true");
    } else {
      setError(res.error || "Registration failed. Try again.");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl bg-white border border-neutral-200 rounded-2xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-3 shadow-md">
            <Store size={24} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Create your Store Account</h1>
          <p className="text-sm text-neutral-500 mt-1">Start managing your grocery inventory and POS today</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Store Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Store Name *</label>
                <div className="relative">
                  <Store className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                  <input
                    type="text"
                    name="shopName"
                    required
                    placeholder="e.g. Green Valley Grocery"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Store Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="01700000000"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  name="currency"
                  defaultValue="USD"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Symbol</label>
                <input
                  type="text"
                  name="currencySymbol"
                  defaultValue="$"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Village/Area</label>
                <input
                  type="text"
                  name="village"
                  placeholder="e.g. Downtown"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">District</label>
                <input
                  type="text"
                  name="district"
                  placeholder="e.g. Dhaka"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <hr className="border-neutral-100" />

          {/* Owner Account Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Owner Credentials</h2>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                <input
                  type="text"
                  name="ownerName"
                  required
                  placeholder="Your Full Name"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@store.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Password (6+ chars) *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>Register Store & Owner <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500 mt-6">
          Already have a store account?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}