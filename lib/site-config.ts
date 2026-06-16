export const siteConfig = {
  name: "automotoflux",
  title: "AutoMotoFlux - Vehicle Parts & Accessories Guide",
  shortTitle: "AutoMotoFlux",
  description: "Expert guides on vehicle parts, auto accessories, and automotive maintenance. From engine components to exterior upgrades, find trusted advice for every driver.",
  tagline: "Your Trusted Source for Auto Parts & Accessories Knowledge",
  url: "https://automotoflux.com",
  ogImage: "https://s.alicdn.com/@sc02/kf/A08fc6fd610aa41f5bd7e913d02989e51F.jpg",
  colors: {
    primary: "#1e3a5f",
    primaryDark: "#0f2440",
    secondary: "#c9a962",
    accent: "#e63946",
  },
  categories: [
    { key: "engine-parts", label: "Engine Parts", description: "Comprehensive guides on engine components, maintenance, and performance upgrades" },
    { key: "exterior-accessories", label: "Exterior Accessories", description: "Body kits, lighting, paint protection, and exterior styling guides" },
    { key: "interior-upgrades", label: "Interior Upgrades", description: "Seats, dashboards, electronics, and comfort enhancements for your cabin" },
    { key: "wheels-tires", label: "Wheels & Tires", description: "Tire selection, wheel fitment, alignment, and seasonal tire advice" },
    { key: "electrical-systems", label: "Electrical Systems", description: "Batteries, alternators, wiring, and modern vehicle electronics explained" },
    { key: "maintenance-tools", label: "Maintenance & Tools", description: "Essential tools, DIY maintenance tips, and professional service guidance" },
  ] as { key: string; label: string; description: string }[],
};
