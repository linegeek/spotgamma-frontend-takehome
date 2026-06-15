interface Props {
  label: string;
}

export function ColumnHeader({ label }: Props) {
  return <div className="col-header">{label}</div>;
}
