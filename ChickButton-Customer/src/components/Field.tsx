export function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="field"><span>{label}</span><input required placeholder={placeholder}/></label>
}
