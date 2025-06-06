interface AccentColor {
  name: string;
  value: string;
  class: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  // Primary Colors (Blue first as default)
  { name: "Blue", value: "#0A84FF", class: "bg-[#0A84FF]" },
  { name: "Matrix Green", value: "#00FF41", class: "bg-[#00FF41]" },
  { name: "Neon Red", value: "#FF003C", class: "bg-[#FF003C]" },
  { name: "Purple", value: "#BF5AF2", class: "bg-[#BF5AF2]" },
  { name: "Orange", value: "#FF9F0A", class: "bg-[#FF9F0A]" },
  { name: "Pink", value: "#FF375F", class: "bg-[#FF375F]" },
  // Cool Colors
  { name: "Teal", value: "#64D2FF", class: "bg-[#64D2FF]" },
  { name: "Indigo", value: "#5E5CE6", class: "bg-[#5E5CE6]" },
  { name: "Deep Blue", value: "#0040DD", class: "bg-[#0040DD]" },
  // Warm Colors
  { name: "Yellow", value: "#FFD60A", class: "bg-[#FFD60A]" },
  { name: "Amber", value: "#FFB020", class: "bg-[#FFB020]" },
  { name: "Coral", value: "#FF7D6B", class: "bg-[#FF7D6B]" },
  // Soft Colors
  { name: "Mint", value: "#66D4CF", class: "bg-[#66D4CF]" },
  { name: "Lavender", value: "#E4B4F4", class: "bg-[#E4B4F4]" },
  { name: "Peach", value: "#FFB38A", class: "bg-[#FFB38A]" },
  // Deep Colors
  { name: "Deep Purple", value: "#8A2BE2", class: "bg-[#8A2BE2]" },
  { name: "Deep Green", value: "#2E8B57", class: "bg-[#2E8B57]" },
  { name: "Rose", value: "#FF6B6B", class: "bg-[#FF6B6B]" },
]; 