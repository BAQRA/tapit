import type { SelectHTMLAttributes } from "react";
import type { BusinessListItem } from "../../../../shared/api";

interface BusinessSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  businesses: BusinessListItem[];
  value: string | null;
  onChange: (businessId: string | null) => void;
  /** Label of the "no business" option. */
  emptyLabel: string;
}

/** A dropdown of businesses where the empty option means null. */
export function BusinessSelect({ businesses, value, onChange, emptyLabel, ...props }: BusinessSelectProps) {
  return (
    <select {...props} value={value ?? ""} onChange={(event) => onChange(event.target.value || null)}>
      <option value="">{emptyLabel}</option>
      {businesses.map((business) => (
        <option key={business.id} value={business.id}>
          {business.name}
        </option>
      ))}
    </select>
  );
}
