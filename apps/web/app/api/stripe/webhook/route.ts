import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: Record<string, string>; payment_status?: string };
    const userId = session.metadata?.supabase_user_id;
    const credits = Number(session.metadata?.credits);

    if (!userId || !credits) {
      return NextResponse.json({ error: "Missing metadata on checkout session" }, { status: 400 });
    }

    // Card payments settle synchronously, so this is normally already "paid"
    // by the time this event fires. Guards against granting credits early if
    // an async payment method (not currently offered) is ever enabled.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.rpc("rpc_grant_purchase_credits", {
      p_user_id: userId,
      p_amount: credits,
      p_stripe_event_id: event.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
