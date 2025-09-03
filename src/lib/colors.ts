export function normalizeType(type: string): string {
  const t = (type || "").toLowerCase();
  const has = (s: string) => t.includes(s);

  if (has("homicide") || has("murder")) return "Homicide";

  if (has("discharge") && has("firearm")) return "Firearm";
  if (has("firearm") || has("shoot")) return "Firearm";

  if (has("sexual assault")) return "Sexual Assault";
  if (has("assault")) return "Assault";

  if (has("robbery")) return "Robbery";

  if (has("theft of motor") || has("theft of vehicle") || has("auto theft"))
    return "Theft Of Motor Vehicle";
  if (has("theft")) return "Theft";

  if ((has("break") && has("enter")) || has("b&e")) return "B&E";
  if (has("unlawfully") && has("dwelling")) return "Unlawfully In Dwelling-House";

  if (has("arson")) return "Arson";
  if (has("fraud")) return "Fraud";
  if (has("threat")) return "Utter Threats";
  if (has("noxious")) return "Administering Noxious Thing";
  if (has("criminal negligence")) return "Criminal Negligence Bodily Harm";
  if (has("disarming") && has("peace")) return "Disarming Peace/Public Officer";

  if (has("mischief") || has("property damage")) return "Mischief";

  return type || "Incident";
}

const palette: Record<string, string> = {
  // Violent / person crimes
  Homicide: "#065f46", // emerald-800
  Assault: "#ef4444", // red-500
  "Sexual Assault": "#db2777", // pink-600
  Robbery: "#e11d48", // rose-600
  "Utter Threats": "#4f46e5", // indigo-600
  "Criminal Negligence Bodily Harm": "#0ea5e9", // sky-500
  "Administering Noxious Thing": "#22c55e", // green-500
  "Disarming Peace/Public Officer": "#3b82f6", // blue-500

  // Property crimes
  "B&E": "#7c3aed", // violet-600
  "Unlawfully In Dwelling-House": "#8b5cf6", // violet-500
  Theft: "#f59e0b", // amber-500
  "Theft Of Motor Vehicle": "#d97706", // amber-600
  Mischief: "#6b7280", // gray-500
  Arson: "#ea580c", // orange-600

  // Weapons / firearm
  Firearm: "#2563eb", // blue-600

  // Financial
  Fraud: "#0891b2", // cyan-600

  // Default
  Incident: "#64748b", // slate-500
};

function hashColor(input: string): string {
  // Simple consistent HSL color fallback for unknown categories
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 48%)`;
}

export function colorForType(type: string): string {
  const key = normalizeType(type);
  return palette[key] || hashColor(key);
}
