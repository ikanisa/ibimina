"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Section } from "../components/Section";

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

type FormData = z.infer<typeof Schema>;

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = async (data: FormData) => {
    // TODO: post to your email service / ticketing
    console.log("contact", data);
    alert("Thank you! We will get back to you.");
  };

  return (
    <>
      <Section title="Contact us">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-w-xl">
          <input
            placeholder="Full name"
            {...register("name")}
            className="glass p-3 rounded-lg text-black"
          />
          {errors.name && <p className="text-red-200 text-sm">{errors.name.message}</p>}
          <input
            placeholder="Email"
            {...register("email")}
            className="glass p-3 rounded-lg text-black"
          />
          {errors.email && <p className="text-red-200 text-sm">{errors.email.message}</p>}
          <textarea
            placeholder="Your message"
            rows={6}
            {...register("message")}
            className="glass p-3 rounded-lg text-black"
          />
          {errors.message && <p className="text-red-200 text-sm">{errors.message.message}</p>}
          <button
            disabled={isSubmitting}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send"}
          </button>
          {isSubmitSuccessful && <p className="text-green-200">Message sent.</p>}
        </form>
      </Section>
    </>
  );
}
