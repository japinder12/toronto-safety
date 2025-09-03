export function normalizeType(type: string): string {
  const t = (type || "").toLowerCase();
  // Collapse similar labels
  if (t.includes("robbery")) return "Robbery";
  if (t.includes("theft")) return "Theft";
  if (t.includes("assault")) return "Assault";
  if (t.includes("break") || t.includes("b&e")) return "B&E";
  if (t.includes("homicide")) return "Homicide";
  if (t.includes("shoot") || t.includes("firearm")) return "Firearm";
  if (t.includes("fraud")) return "Fraud";
  if (t.includes("mischief") || t.includes("property damage")) return "Mischief";
  return type || "Incident";
}

const palette: Record<string, string> = {
  Robbery: "#e11d48", // rose-600
  "Theft Of Motor Vehicle": "#d97706", // amber-600
  Theft: "#d97706",
  Assault: "#dc2626", // red-600
  "B&E": "#7c3aed", // violet-600
  Homicide: "#0f766e", // teal-700
  Firearm: "#2563eb", // blue-600
  Mischief: "#6b7280", // gray-500
  Incident: "#64748b",
};

export function colorForType(type: string): string {
  const key = normalizeType(type);
  return palette[key] || palette["Incident"];
}

