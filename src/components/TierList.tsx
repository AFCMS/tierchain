import { useState } from "react";
import { useParams } from "react-router";
import { TierItem } from "./TierItem";
import type { Ranking } from "./ItemRankings";

export function TierList() {
  const { id } = useParams();
  // const editable = false;

  const [items] = useState<{
    [key in Ranking | "POOL"]: string[];
  }>({
    S: ["S0", "S1", "S2"],
    A: ["A0", "A1", "A2"],
    B: ["B0", "B1"],
    C: [],
    D: ["D0"],
    POOL: ["POOL0", "POOL1", "POOL2", "POOL3"],
  });

  return (
    <>
      <div className="grid max-w-3xl grid-cols-[5rem_1fr] gap-0.5 bg-zinc-200">
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="S"
        >
          S
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.S.map((item) => (
            <TierItem key={item} name={item} />
          ))}
        </div>
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="A"
        >
          A
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.A.map((item) => (
            <TierItem key={item} name={item} />
          ))}
        </div>
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="B"
        >
          B
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.B.map((item) => (
            <TierItem key={item} name={item} />
          ))}
        </div>
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="C"
        >
          C
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.C.map((item) => (
            <TierItem key={item} name={item} />
          ))}
        </div>
        <div
          className="flex size-20 items-center justify-center"
          data-rank-bg="D"
        >
          D
        </div>
        <div className="flex flex-wrap gap-0.5">
          {items.D.map((item) => (
            <TierItem key={item} name={item} />
          ))}
        </div>
      </div>
      <div className="mt-4 flex w-full flex-wrap gap-0.5">
        {items.POOL.map((item) => (
          <TierItem key={item} name={item} />
        ))}
      </div>
    </>
  );
}
