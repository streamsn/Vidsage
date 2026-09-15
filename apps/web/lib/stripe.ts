import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripeClient() {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");
    client = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  }
  return client;
}
