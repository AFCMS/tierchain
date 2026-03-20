import { TierList } from "../components/TierList"
import { ItemRankings } from "../components/ItemRankings"

export function ListDetail() {
  return (
    <>
      <TierList />
      <div className="card">
        <h1 className="card-title">Scores</h1>
        <ItemRankings
          data={{
            S: 21,
            A: 10,
            B: 2,
            C: 5,
            D: 14,
          }}
        />
      </div>
    </>
  )
}