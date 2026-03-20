export type Ranking = "S" | "A" | "B" | "C" | "D";

export type ItemRankingData = {
  [key in Ranking]: number;
};

export interface ItemRankingsProps {
  readonly data: ItemRankingData;
}

export function ItemRankings(props: ItemRankingsProps) {
  const safeNumber = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : 0;

  const total = Object.values(props.data).reduce(
    (acc, value) => acc + safeNumber(value),
    0,
  );

  return (
    <div className="gap-2">
      {(Object.keys(props.data) as Ranking[]).map((ranking) => {
        const score = safeNumber(props.data[ranking]);
        const pct = total > 0 ? (score / total) * 100 : 0;

        return (
          <div key={ranking} className={`flex flex-col p-2`}>
            <div className="flex flex-row items-center justify-between">
              <span data-rank={ranking} className={"flex-1 font-bold"}>
                {ranking}
              </span>

              {/* raw score + percent (all guaranteed numbers) */}
              <span className="text-sm tabular-nums">
                {score} / {total} ({pct.toFixed(1)}%)
              </span>
            </div>

            <progress
              className={"progress"}
              value={score}
              max={total}
              data-rank={ranking}
            ></progress>
          </div>
        );
      })}
    </div>
  );
}
