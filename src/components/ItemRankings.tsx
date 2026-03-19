export type Ranking = "S" | "A" | "B" | "C" | "D";

export type ItemRankingData = {
  [key in Ranking]: number;
};

export interface ItemRankingsProps {
  readonly data: ItemRankingData;
}

export function ItemRankings(props: ItemRankingsProps) {
  const total = Object.values(props.data).reduce(
    (acc, value) => acc + value,
    0,
  );
  return (
    <div className="flex flex-col gap-2 max-w-32 bg-zinc-200 p-4">
      {Object.keys(props.data).map((ranking) => (
        <div key={ranking} className={`flex flex-col p-2`}>
          <div className="flex flex-row">
            <span
              className={
                "font-bold" + ranking === "S"
                  ? "text-red-500"
                  : ranking === "A"
                    ? "text-orange-500"
                    : ranking === "B"
                      ? "text-amber-500"
                      : ranking === "C"
                        ? "text-yellow-500"
                        : "text-green-500"
              }
            >
              {ranking}
            </span>
          </div>
          <progress
            className={"progress"}
            value={props.data[ranking as Ranking]}
            max={total}
          ></progress>
        </div>
      ))}
    </div>
  );
}
