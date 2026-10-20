export type ProvinceType =
  | "province"
  | "capital-city";

export interface DataSource {
  institution: string;
  document?: string;
  year?: number;
  url?: string;
  accessedAt?: string;
}

export interface Province {
  id: string;
  code: string | null;

  name: string;
  slug: string;

  type: ProvinceType;

  capital: string | null;

  source?: DataSource;
}
