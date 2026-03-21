import { Link } from "react-router";

export interface TierListItemProps {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly active: boolean;
  readonly cover?: string;
}

export function TierListItem(props: TierListItemProps) {
  return (
    <Link
      to={`/list/${props.id}`}
      className={
        "card bg-base-300 card-md w-lg shadow-lg" +
        (props.cover ? " card-side" : "")
      }
    >
      <div className="card-body">
        <h2 className="card-title justify-between">
          {props.name}
          <div
            className={
              "badge badge-soft" +
              (props.active ? " badge-success" : " badge-error")
            }
          >
            {props.active ? "Active" : "Inactive"}
          </div>
        </h2>
        <p>{props.description}</p>
      </div>
      {props.cover ? (
        <figure className="aspect-square">
          <img
            src={props.cover}
            alt="Movie"
            className="aspect-square size-26 bg-contain"
            loading="lazy"
            fetchPriority="auto"
          />
        </figure>
      ) : undefined}
    </Link>
  );
}
