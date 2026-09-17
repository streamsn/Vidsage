import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { CREDIT_PACKAGES, type CreditPackageId } from "@video-grabber/shared";
import { requireUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

const PRICE_ENV_BY_PACKAGE: Record<CreditPackageId, string | undefined> = {
  small: process.env.STRIPE_PRICE_ID_SMALL,
  large: process.env.STRIPE_PRICE_ID_LARGE,
};

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  const { userId, supabase } = auth;

  const { packageId } = (await request.json()) as { packageId: CreditPackageId };
  const pkg = CREDIT_PACKAGES[packageId];
  const priceId = PRICE_ENV_BY_PACKAGE[packageId];

  if (!pkg || !priceId) {
    return NextResponse.json({ error: "Unknown credit package" }, { status: 400 });
  }

  const { data: userData } = await supabase.auth.getUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // TODO: remove once product tax codes are set in the Stripe dashboard —
  // Managed Payments (on by default) requires a tax_code on every product,
  // which these test products don't have yet.
  const params: Stripe.Checkout.SessionCreateParams & {
    managed_payments?: { enabled: boolean };
  } = {
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: userData.user?.email ?? undefined,
    metadata: {
      supabase_user_id: userId,
      credits: String(pkg.credits),
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel`,
    managed_payments: { enabled: false },
  };

  const session = await getStripeClient().checkout.sessions.create(params);

  return NextResponse.json({ url: session.url });
}
