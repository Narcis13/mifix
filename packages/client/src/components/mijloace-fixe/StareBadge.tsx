import { Badge } from "@/components/ui/badge";

const stareConfig = {
  activ: {
    label: "Activ",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  conservare: {
    label: "Conservare",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  casat: {
    label: "Casat",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  transferat: {
    label: "Transferat",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  vandut: {
    label: "Vandut",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
} as const;

type Stare = keyof typeof stareConfig;

interface StareBadgeProps {
  stare: string;
}

export function StareBadge({ stare }: StareBadgeProps) {
  const config = stareConfig[stare as Stare] || {
    label: stare,
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
