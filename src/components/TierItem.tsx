export interface TierItemProps {
  readonly name: string;
  readonly image?: string;
}

export function TierItem(props: TierItemProps) {
  return props.image ? (
    <img
      src={props.image}
      alt="Tier item"
      className="size-20 rounded object-cover"
    />
  ) : (
    <div className="flex size-20 items-center justify-center rounded bg-zinc-300">
      {props.name}
    </div>
  );
}
