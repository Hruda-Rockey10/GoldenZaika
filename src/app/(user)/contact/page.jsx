"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import useWeb3Forms from "@web3forms/react";
import { toast } from "react-toastify";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { authService } from "@/services/auth.service";

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
  });

  // Access Key
  const apiKey =
    process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || "YOUR_ACCESS_KEY_HERE";

  const { submit: onSubmitWeb3 } = useWeb3Forms({
    access_key: apiKey,
    settings: {
      from_name: "Golden Zaika Contact",
      subject: "New Contact Message from Golden Zaika",
    },
    onSuccess: (msg, data) => {
      toast.success(msg || "Message sent successfully!");
      reset();
    },
    onError: (msg, data) => {
      toast.error(msg || "Something went wrong sending email.");
    },
  });

  const onSubmit = async (data) => {
    // 1. Send to Backend Microservice (Database)
    // We do this manually alongside the Web3Forms hook
    try {
      await authService.sendMessage(data);
    } catch (error) {
      console.error("DB Save Failed:", error);
      // We rely on Web3Forms for the main success feedback to user,
      // but logs will help admin know if DB is failing.
    }

    // 2. Submit to Web3Forms
    onSubmitWeb3(data);
  };

  return (
    <div className="min-h-screen relative bg-black font-sans">
      {/* Background Image with Blur */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/food-types/biryani.jpg"
          alt="Background"
          fill
          className="object-cover opacity-60"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 pt-28 px-4 md:px-12 max-w-7xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Get in <span className="text-primary-gold">Touch</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We&apos;d love to hear from you. Whether you have a question about
              our menu, pricing, or anything else, our team is ready to answer
              all your questions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl hover:border-primary-gold/30 transition-all h-full flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-8 text-white border-b border-white/10 pb-4">
                  Contact Information
                </h3>
                <div className="space-y-8">
                  <motion.div
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-6 group"
                  >
                    <div className="p-4 bg-primary-gold/10 rounded-2xl text-primary-gold group-hover:bg-primary-gold group-hover:text-black transition-all duration-300">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1 text-white">
                        Our Location
                      </h4>
                      <p className="text-gray-400 leading-relaxed">
                        Ganesh Street, <br />
                        Berhampur, Odisha, India
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-6 group"
                  >
                    <div className="p-4 bg-primary-gold/10 rounded-2xl text-primary-gold group-hover:bg-primary-gold group-hover:text-black transition-all duration-300">
                      <Phone size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1 text-white">
                        Phone Number
                      </h4>
                      <p className="text-gray-400">+91 7978326 ***</p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-6 group"
                  >
                    <div className="p-4 bg-primary-gold/10 rounded-2xl text-primary-gold group-hover:bg-primary-gold group-hover:text-black transition-all duration-300">
                      <Mail size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1 text-white">
                        Email Address
                      </h4>
                      <p className="text-gray-400">hruda.iit.work@gmail.com</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <h3 className="text-2xl font-bold mb-8 text-white relative z-10">
                Send us a Message
              </h3>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 relative z-10"
              >
                {/* Bot Check (Hidden) */}
                <input
                  type="checkbox"
                  className="hidden"
                  style={{ display: "none" }}
                  {...register("botcheck")}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300 ml-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      className={`w-full px-5 py-4 bg-black/20 border rounded-xl focus:outline-none focus:border-primary-gold text-white placeholder-gray-500 transition-all focus:bg-black/40 ${
                        errors.name ? "border-red-500" : "border-white/10"
                      }`}
                      placeholder="John Doe"
                      {...register("name", {
                        required: "Name is required",
                        maxLength: 80,
                      })}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500 ml-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300 ml-1">
                      Your Email
                    </label>
                    <input
                      type="email"
                      className={`w-full px-5 py-4 bg-black/20 border rounded-xl focus:outline-none focus:border-primary-gold text-white placeholder-gray-500 transition-all focus:bg-black/40 ${
                        errors.email ? "border-red-500" : "border-white/10"
                      }`}
                      placeholder="john@example.com"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500 ml-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300 ml-1">
                    Message
                  </label>
                  <textarea
                    rows="5"
                    className={`w-full px-5 py-4 bg-black/20 border rounded-xl focus:outline-none focus:border-primary-gold text-white placeholder-gray-500 transition-all focus:bg-black/40 resize-none ${
                      errors.message ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="How can we help you?"
                    {...register("message", {
                      required: "Message is required",
                    })}
                  ></textarea>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500 ml-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary-gold text-black font-bold rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin mx-auto text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message <Send size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
