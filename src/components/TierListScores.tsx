import { useGetItemVoteCounts } from "../hooks/contract";
import { ItemRankings } from "./ItemRankings";
import { TierItemSimple } from "./TierItemSimple";

export interface TierListScoresProps {
  readonly tlId: number;
  readonly globalVotesItemId: number | null;
  readonly globalVotesItemName: string | null;
}

export function TierListScores(props: TierListScoresProps) {
  const hasSelectedItem =
    props.globalVotesItemId !== null && props.globalVotesItemName !== null;

  const itemVotesCount = useGetItemVoteCounts(
    BigInt(props.tlId),
    props.globalVotesItemId !== null
      ? BigInt(props.globalVotesItemId)
      : undefined,
    hasSelectedItem,
  );

  const rankingData = {
    S: Number(itemVotesCount.data?.[0] ?? 0n),
    A: Number(itemVotesCount.data?.[1] ?? 0n),
    B: Number(itemVotesCount.data?.[2] ?? 0n),
    C: Number(itemVotesCount.data?.[3] ?? 0n),
    D: Number(itemVotesCount.data?.[4] ?? 0n),
  };

  return (
    <div className="bg-base-300 relative mb-0.5 flex min-h-full flex-1 flex-col gap-2 p-4">
      <h2 className="text-lg font-semibold">Global Scores</h2>
      {hasSelectedItem ? (
        <>
          <div className="flex-1"></div>
          <div className="absolute top-4 right-4">
            <TierItemSimple
              tlId={props.tlId}
              id={props.globalVotesItemId}
              name={props.globalVotesItemName}
            />
          </div>
          {itemVotesCount.isLoading ? (
            <span
              className="loading loading-spinner loading-md self-center"
              aria-label="Loading scores"
            ></span>
          ) : (
            <ItemRankings data={rankingData} />
          )}
        </>
      ) : (
        <p className="text-sm italic">No item selected</p>
      )}
    </div>
  );
}
