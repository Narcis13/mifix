import type { ReactNode } from "react";

interface PrintLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  generatedDate?: Date;
}

export function PrintLayout({
  children,
  title,
  subtitle,
  generatedDate = new Date(),
}: PrintLayoutProps) {
  const formattedDate = generatedDate.toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="print-layout">
      <div className="print-header">
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
        <p className="date">Generat la: {formattedDate}</p>
      </div>
      <div className="print-content">{children}</div>
    </div>
  );
}
