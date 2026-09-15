import { CREDIT_PACKAGES, type CreditPackageId } from "@video-grabber/shared";
import { useAppStore } from "../state/store";
import { openCheckout } from "../lib/api";

export function BuyCreditsModal({ onClose }: { onClose: () => void }) {
  const session = useAppStore((s) => s.session);

  async function handleBuy(packageId: CreditPackageId) {
    if (!session) return;
    await openCheckout(session.access_token, packageId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-xl bg-white p-5 shadow-lg">
        <h3 className="mb-3 text-sm font-semibold">Buy credits to keep going</h3>
        <div className="flex flex-col gap-2">
          {Object.values(CREDIT_PACKAGES).map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleBuy(pkg.id as CreditPackageId)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-slate-400"
            >
              <span className="font-medium">{pkg.credits} credits</span>
              <span className="ml-2 text-slate-500">${pkg.priceUsd}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 text-xs text-slate-400 hover:text-slate-600">
          Not now
        </button>
      </div>
    </div>
  );
}
