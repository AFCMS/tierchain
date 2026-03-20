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
    <div className="card-body flex max-w-96 flex-col gap-2 p-4">
      <h1 className="card-title">Scores</h1>
      {(Object.keys(props.data) as Ranking[]).map((ranking) => (
        <div key={ranking} className={`flex flex-col p-2`}>
          <div className="flex flex-row items-center justify-between">
            <span data-rank={ranking} className={"flex-1 font-bold"}>
              {ranking}
            </span>
            <span className="text-sm">
              {((props.data[ranking] / total) * 100).toFixed(1)}%
            </span>
          </div>
          <progress
            className={"progress"}
            value={props.data[ranking]}
            max={total}
            data-rank={ranking}
          ></progress>
        </div>
      ))}
    </div>
  );
}
