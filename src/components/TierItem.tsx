import { getTierListItemAsset } from "../data/tierlists";

export interface TierItemProps {
  readonly tlId: number;
  readonly id: number;
  readonly name: string;
}

export function TierItem(props: TierItemProps) {
  const image = getTierListItemAsset(props.tlId, props.name);

  return image ? (
    <img
      src={image}
      alt="Tier item"
      className="size-20 rounded object-contain"
      title={props.name}
      loading="lazy"
      fetchPriority="auto"
    />
  ) : (
    <div className="flex size-20 items-center justify-center rounded bg-zinc-300">
      {props.name}
    </div>
  );
}
