import type { ColumnDef } from "@tanstack/react-table";
import type { MijlocFix } from "shared";
import { StareBadge } from "./StareBadge";

export const mijlocFixColumns: ColumnDef<MijlocFix>[] = [
  {
    accessorKey: "numarInventar",
    header: "Nr. Inventar",
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {row.getValue("numarInventar")}
      </span>
    ),
  },
  {
    accessorKey: "denumire",
    header: "Denumire",
    cell: ({ row }) => (
      <span className="max-w-[300px] truncate block">
        {row.getValue("denumire")}
      </span>
    ),
  },
  {
    accessorKey: "clasificareCod",
    header: "Clasificare",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.getValue("clasificareCod")}
      </span>
    ),
  },
  {
    accessorKey: "gestiune",
    header: "Gestiune",
    cell: ({ row }) => {
      const gestiune = row.original.gestiune;
      return gestiune ? `${gestiune.cod} - ${gestiune.denumire}` : "-";
    },
  },
  {
    accessorKey: "valoareInventar",
    header: "Valoare",
    cell: ({ row }) => {
      const value = row.getValue("valoareInventar") as string;
      return (
        <span className="text-right font-mono">
          {parseFloat(value).toLocaleString("ro-RO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          RON
        </span>
      );
    },
  },
  {
    accessorKey: "stare",
    header: "Stare",
    cell: ({ row }) => <StareBadge stare={row.getValue("stare")} />,
  },
];
