import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useGetLatestSubmissions } from "../hooks/contract";
import { AddressLink } from "./AddressLink";

interface LatestSubmissionsProps {
  readonly id: bigint;
}

export function LatestSubmissions(props: LatestSubmissionsProps) {
  const PAGE_SIZE = 20n;
  const [submissionsOffset, setSubmissionsOffset] = useState(0n);

  const latestSubmissions = useGetLatestSubmissions(
    props.id,
    true,
    PAGE_SIZE,
    submissionsOffset,
  );

  const latestSubmitters = latestSubmissions.data ?? [];

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
          {latestSubmitters.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-sm text-zinc-500">
                No submissions yet.
              </td>
            </tr>
          ) : (
            latestSubmitters.map((acct, i) => (
              <tr key={`${acct}-${i}`}>
                <td>{Number(submissionsOffset) + i + 1}</td>
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
            ))
          )}
        </tbody>
      </table>
      <div className="mt-4 flex flex-row justify-center">
        <div className="join">
          <button
            className="join-item btn"
            disabled={submissionsOffset === 0n}
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
            onClick={() => setSubmissionsOffset((x) => x + PAGE_SIZE)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
