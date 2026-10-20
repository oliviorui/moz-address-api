import provincesData from "../../../data/current/provinces.json" with {
  type: "json"
};

import type { Province } from "./province.types.js";

const provinces = provincesData as Province[];

export function getAllProvinces(): Province[] {
  return provinces;
}

export function getProvinceByIdentifier(
  identifier: string
): Province | undefined {
  const normalizedIdentifier = identifier.toLowerCase();

  return provinces.find((province) => {
    return (
      province.id.toLowerCase() === normalizedIdentifier ||
      province.slug.toLowerCase() === normalizedIdentifier
    );
  });
}
