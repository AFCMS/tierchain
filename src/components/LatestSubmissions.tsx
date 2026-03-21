import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useBlockNumber } from "wagmi";
import {
  useGetLatestSubmissions,
  useWatchRankingSubmitted,
} from "../hooks/contract";
import { AddressLink } from "./AddressLink";
import type { Address } from "viem";

interface LatestSubmissionsProps {
  readonly id: bigint;
}

type LiveRow = {
  readonly voter: Address;
  readonly submissionIndex: bigint;
};

export function LatestSubmissions(props: LatestSubmissionsProps) {
  const PAGE_SIZE = 20n;
  const [submissionsOffset, setSubmissionsOffset] = useState(0n);

  const latestSubmissions = useGetLatestSubmissions(
    props.id,
    true,
    PAGE_SIZE,
    submissionsOffset,
  );

  const latestSubmitters = useMemo(
    () => latestSubmissions.data ?? [],
    [latestSubmissions.data],
  );

  const [liveRows, setLiveRows] = useState<readonly LiveRow[]>([]);

  const { data: bn } = useBlockNumber({ watch: false });
  const startBlockRef = useRef<bigint | null>(null);

  useEffect(() => {
    if (submissionsOffset !== 0n) setLiveRows([]);
  }, [submissionsOffset]);

  useEffect(() => {
    if (startBlockRef.current !== null) return;
    if (bn === undefined) return;
    startBlockRef.current = bn; // everything <= this is "past"
  }, [bn]);

  useWatchRankingSubmitted(
    submissionsOffset === 0n && startBlockRef.current !== null,
    ({ voter, tierListId, submissionIndex }) => {
      if (tierListId !== props.id) return;
      if (submissionsOffset !== 0n) return;

      setLiveRows((cur) => {
        if (cur.some((r) => r.submissionIndex === submissionIndex)) return cur;

        const next = [{ voter, submissionIndex }, ...cur];

        // keep it bounded so UI doesn't grow forever if user sits here
        return next.slice(0, Number(PAGE_SIZE));
      });
    },
    startBlockRef.current ?? undefined,
  );

  const rows = useMemo(() => {
    if (submissionsOffset !== 0n) return latestSubmitters;

    // build a list: live prepends first, then fetched list, de-duped by address
    const out: { acct: Address; live?: LiveRow }[] = [];

    for (const r of liveRows) {
      out.push({ acct: r.voter, live: r });
    }

    for (const acct of latestSubmitters) {
      out.push({ acct });
    }

    return out;
  }, [latestSubmitters, liveRows, submissionsOffset]);

  return (
    <section className="">
      <h2 className="mb-2 text-lg font-semibold">Latest submissions</h2>
      <table className="table-zebra table">
        <thead>
          <tr>
            <th>#</th>
            <th>Account</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-sm text-zinc-500">
                No submissions yet.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const acct =
                typeof row === "string" ? (row as Address) : row.acct;
              const live = typeof row === "string" ? undefined : row.live;

              const num = live ? i : Number(submissionsOffset) + i;

              return (
                <tr key={`${acct}-${i}`}>
                  <td>{num}</td>
                  <td>
                    <AddressLink address={acct} />
                  </td>
                  <td>
                    <Link
                      className="btn btn-ghost"
                      to={`/list/${props.id}/address/${acct}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="my-4 flex flex-row justify-center">
        <div className="join">
          <button
            className="join-item btn"
            disabled={submissionsOffset === 0n}
            aria-label="Previous page"
            onClick={() =>
              setSubmissionsOffset((x) => (x > PAGE_SIZE ? x - PAGE_SIZE : 0n))
            }
          >
            <ChevronLeft />
          </button>
          <button className="join-item btn">
            Page {Number(submissionsOffset) / Number(PAGE_SIZE) + 1}
          </button>
          <button
            className="join-item btn"
            disabled={latestSubmitters.length < Number(PAGE_SIZE)}
            aria-label="Next page"
            onClick={() => setSubmissionsOffset((x) => x + PAGE_SIZE)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
