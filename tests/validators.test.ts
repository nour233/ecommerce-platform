import { describe, expect, it } from "vitest";
import { cartItemSchema, registerSchema, verificationCodeSchema } from "@/lib/validators";

describe("request validation", () => {
  it("normalizes a valid registration email", () => {
    const registration = registerSchema.parse({
      name: "Nour Slmi",
      email: " NOUR@EXAMPLE.COM ",
      password: "secure-password"
    });

    expect(registration.email).toBe("nour@example.com");
  });

  it("rejects invalid registration, cart, and verification data", () => {
    expect(() => registerSchema.parse({ name: "N", email: "invalid", password: "short" })).toThrow();
    expect(() => cartItemSchema.parse({ productId: "", quantity: 0 })).toThrow();
    expect(() => verificationCodeSchema.parse({ email: "user@example.com", code: "123" })).toThrow();
  });
});
