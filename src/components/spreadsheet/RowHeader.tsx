interface Props {
  label: number;
}

export function RowHeader({ label }: Props) {
  return <div className="row-header">{label}</div>;
}
