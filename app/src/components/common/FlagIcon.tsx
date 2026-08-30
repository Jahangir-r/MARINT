import clsx from "clsx";
import { FLAG_ASSET } from "../../lib/flags";
import { countryName } from "../../lib/format";
import type { Country } from "../../types";

export default function FlagIcon({ country, className }: { country: Country; className?: string }) {
  return (
    <img
      src={FLAG_ASSET[country]}
      alt={`${countryName(country)} flag`}
      className={clsx("inline-block rounded-[2px] object-cover shrink-0 ring-1 ring-ink/10", className)}
    />
  );
}
