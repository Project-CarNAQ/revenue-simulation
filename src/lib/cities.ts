/**
 * City-based areas for realistic trip routing
 */

export const CITY_AREAS: Record<string, string[]> = {
  Lahore: [
    "Gulberg III",
    "DHA Phase 5",
    "DHA Phase 6",
    "Model Town",
    "Johar Town",
    "Mall Road",
    "Allama Iqbal Town",
    "Bahria Town",
    "Faisal Town",
    "Cantt",
    "Wapda Town",
    "Shadman",
    "Allama Iqbal Airport",
    "Cavalry Ground",
  ],
  Karachi: [
    "Clifton Block 4",
    "DHA Phase 6",
    "Gulshan-e-Iqbal",
    "Saddar",
    "PECHS Block 2",
    "North Nazimabad",
    "Korangi Industrial Area",
    "Bahria Town Karachi",
    "Gulistan-e-Johar",
    "Jinnah International Airport",
    "I.I. Chundrigar Road",
    "Defence View",
  ],
  Islamabad: [
    "Blue Area",
    "F-6 Super Market",
    "F-7 Jinnah Super",
    "F-10 Markaz",
    "F-11 Markaz",
    "G-11 Markaz",
    "I-8 Markaz",
    "DHA Phase 2",
    "Bahria Town Phase 4",
    "Islamabad International Airport",
    "E-7",
    "G-9 Karachi Company",
  ],
  Rawalpindi: [
    "Saddar",
    "Bahria Town Phase 7",
    "Satellite Town",
    "Chaklala Scheme III",
    "Westridge",
    "Gulraiz Housing",
    "Commercial Market",
  ],
};

const DEFAULT_AREAS = [
  "City Center",
  "Downtown",
  "Airport Road",
  "Commercial District",
  "Residential Sector A",
  "Residential Sector B",
  "Financial District",
  "University Town",
  "Industrial Estate",
];

export function getAreasForCity(city: string): string[] {
  const normalized = city.trim();
  for (const [knownCity, areas] of Object.entries(CITY_AREAS)) {
    if (knownCity.toLowerCase() === normalized.toLowerCase()) {
      return areas;
    }
  }
  return DEFAULT_AREAS;
}
