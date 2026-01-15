export function getRequiredDomains(incident) {
  if (!incident || !incident.category) return [];

  const rules = {
    // 🏥 Medical
    "Medical Emergency": ["Medical Response"],

    // 🔥 Fire
    "Fire": ["Fire & Rescue"],

    // 🌊 Natural disasters
    "Flood": ["Rescue", "Shelter & Relief"],
    "Earthquake": ["Rescue", "Medical Response", "Shelter & Relief"],

    // 🚧 Infrastructure
    "Infrastructure Failure": [
      "Infrastructure & Utilities",
      "Security & Control"
    ],

    // 🚗 Accidents
    "Accident": ["Medical Response", "Traffic Control"],

    // 🤝 Community fallback
    "Other / Unknown": ["Community Support"]
  };

  return rules[incident.category] || [];
}
