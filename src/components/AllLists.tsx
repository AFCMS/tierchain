import { useNavigate } from "react-router";
import { useReadContract } from "wagmi";

import { abi } from "../../artifacts/contracts/TierList.sol/TierList.json";

const tierListAddress = import.meta.env.VITE_CONTRACT_TIERLIST_ADDRESS

type TierListView = {
  id: bigint;
  name: string;
  description: string;
  active: boolean;
  numActiveItems: bigint;
};

export function AllLists({ includeInactive = false }: { includeInactive?: boolean }) {
  const navigate = useNavigate();

  const enabled = Boolean(tierListAddress);

  const { data, isLoading, isError, error } = useReadContract({
    address: tierListAddress,
    abi: abi,
    functionName: "getTierLists",
    args: [includeInactive],
    query: { enabled },
  });

  const lists = (data ?? []) as TierListView[];

  if (!tierListAddress) {
    return <div className="text-sm text-zinc-600">Missing VITE_TIERLIST_ADDRESS</div>;
  }

  if (isLoading) return <div className="text-sm text-zinc-600">Loading tier lists…</div>;
  if (isError) return <div className="text-sm text-red-600">{error?.message ?? "Error"}</div>;

  if (lists.length === 0) {
    return <div className="text-sm text-zinc-600">No tier lists yet.</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lists.map((tl) => {
        const id = Number(tl.id);

        return (
          <button
            key={tl.id.toString()}
            type="button"
            onClick={() => navigate(`/tier-lists/${id}`)}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-zinc-300"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">{tl.name}</h3>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-xs",
                  tl.active ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-700",
                ].join(" ")}
              >
                {tl.active ? "Active" : "Disabled"}
              </span>
            </div>

            {tl.description && <p className="mt-1 text-sm text-zinc-600">{tl.description}</p>}

            <p className="mt-3 text-xs text-zinc-500">Items: {Number(tl.numActiveItems)}</p>
          </button>
        );
      })}
    </div>
  );
}