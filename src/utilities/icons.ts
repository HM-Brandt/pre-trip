export const getItemIcon = (itemName = "") => {
  const name = itemName.toLowerCase();
  if (name.includes("brake")) return "🛑";
  if (name.includes("steering")) return "🎯";
  if (name.includes("tire") || name.includes("wheel") || name.includes("rim"))
    return "🛞";
  if (
    name.includes("light") ||
    name.includes("headlight") ||
    name.includes("signal")
  )
    return "💡";
  if (
    name.includes("mirror") ||
    name.includes("windshield") ||
    name.includes("wiper")
  )
    return "🌧️";
  if (name.includes("horn")) return "📢";
  if (
    name.includes("leak") ||
    name.includes("damage") ||
    name.includes("fluid")
  )
    return "🛢️";
  if (name.includes("emergency") || name.includes("equipment")) return "🧯";
  return "⛽";
};
