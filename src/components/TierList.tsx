import { TierItem } from "./TierItem";

export function TierList() {
  return (
    <div className="grid max-w-3xl grid-cols-[5rem_1fr] gap-0.5 bg-zinc-200">
      <div
        className="flex size-20 items-center justify-center"
        data-rank-bg="S"
      >
        S
      </div>
      <div className="flex flex-wrap">
        {[1, 2, 3, 4, 5].map((item) => (
          <TierItem key={item} />
        ))}
      </div>
      <div
        className="flex size-20 items-center justify-center"
        data-rank-bg="A"
      >
        A
      </div>
      <div>AAA</div>
      <div
        className="flex size-20 items-center justify-center"
        data-rank-bg="B"
      >
        B
      </div>
      <div>AAA</div>
      <div
        className="flex size-20 items-center justify-center"
        data-rank-bg="C"
      >
        C
      </div>
      <div>AAA</div>
      <div
        className="flex size-20 items-center justify-center"
        data-rank-bg="D"
      >
        D
      </div>
      <div>AAA</div>
    </div>
  );
}
