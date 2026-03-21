import { useParams } from "react-router";
import { AlertTriangle } from "lucide-react";

import { TierList } from "../components/TierList";

import { useGetTierList, useGetTierListItems } from "../hooks/contract";
import { LatestSubmissions } from "../components/LatestSubmissions";
import { useDerivedData } from "../hooks/derived_data";

const tierListAddress = import.meta.env.VITE_CONTRACT_TIERLIST_ADDRESS;

export function ListDetail() {
  const { id } = useParams<{ id: string }>();

  const idNum = id ? Number(id) : NaN;
  const _id = Number.isInteger(idNum) && idNum >= 0 ? BigInt(idNum) : undefined;

  const enabled = Boolean(tierListAddress) && _id !== undefined;

  const tierListQuery = useGetTierList(_id, enabled);

  const itemsQuery = useGetTierListItems(_id, enabled);

  const derived = useDerivedData(tierListQuery.data, itemsQuery.data);

  if (!tierListAddress) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>Missing VITE_CONTRACT_TIERLIST_ADDRESS</span>
      </div>
    );
  }

  if (_id === undefined) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>Invalid list id: {id ?? "(missing)"}</span>
      </div>
    );
  }

  if (tierListQuery.isLoading || itemsQuery.isLoading) {
    return <div className="text-sm text-zinc-600">Loading your tier list…</div>;
  }

  if (tierListQuery.isError) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>{tierListQuery.error?.message ?? "Error"}</span>
      </div>
    );
  }

  if (itemsQuery.isError) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>{itemsQuery.error?.message ?? "Error"}</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex w-full justify-center">
      <div className="w-full max-w-6xl">
        <div className="mb-8 flex w-full flex-col gap-2">
          <h1 className="flex w-full justify-between text-2xl font-bold">
            {derived.name}
            <div
              className={
                "badge badge-soft" +
                (derived.active ? " badge-success" : " badge-error")
              }
            >
              {derived.active ? "Active" : "Inactive"}
            </div>
          </h1>
          <p className="text-base-content flex justify-between gap-8">
            {derived.description}
            <span>{derived.numActiveItems.toString()} items</span>
          </p>
        </div>

        <TierList tlId={Number(_id)} items={derived.buckets} editable={true} />

        <div className="mt-8">
          <LatestSubmissions id={_id} />
        </div>
      </div>
    </div>
  );
}
