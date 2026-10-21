import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Province = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  type: "province" | "capital-city";
  capital: string | null;
};

type District = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  provinceId: string;
  type?: "DISTRICT" | "MUNICIPAL_DISTRICT";
};

type AdministrativePost = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  districtId: string;
};

type Source = {
  id: string;
  institution: string;
  title: string;
  type: "OFFICIAL" | "SECONDARY";
  year: number | null;
  url: string | null;
  accessedAt: string | null;
  notes: string | null;
};

type DistrictSource = {
  districtId: string;
  sourceId: string;
  page: string | null;
  notes: string | null;
};

type AdministrativePostSource = {
  administrativePostId: string;
  sourceId: string;
  page: string | null;
  notes: string | null;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const paths = {
  provinces: path.join(
    rootDir,
    "data",
    "current",
    "provinces.json"
  ),

  districts: path.join(
    rootDir,
    "data",
    "current",
    "districts.json"
  ),

  administrativePosts: path.join(
    rootDir,
    "data",
    "current",
    "administrative-posts.json"
  ),

  sources: path.join(
    rootDir,
    "data",
    "sources",
    "sources.json"
  ),

  districtSources: path.join(
    rootDir,
    "data",
    "sources",
    "district-sources.json"
  ),

  administrativePostSources: path.join(
    rootDir,
    "data",
    "sources",
    "administrative-post-sources.json"
  )
};

const expectedDistrictCounts: Record<string, number> = {
  prov_01: 16,
  prov_02: 17,
  prov_03: 23,
  prov_04: 22,
  prov_05: 15,
  prov_06: 12,
  prov_07: 13,
  prov_08: 14,
  prov_09: 14,
  prov_10: 8,
  prov_11: 7
};

/*
 * Neste momento só Maputo Province está completamente
 * carregada ao nível de postos administrativos.
 *
 * Vamos acrescentando as restantes províncias aqui
 * conforme forem concluídas.
 */
const expectedAdministrativePostCountsByProvince:
  Record<string, number> = {
    prov_01: 45,
    prov_03: 72,
    prov_04: 54,
    prov_05: 36,
    prov_10: 29
  };
/*
 * Contagem detalhada por distrito já verificado.
 */
const expectedAdministrativePostCountsByDistrict:
  Record<string, number> = {
    // Niassa
    dist_niassa_lichinga: 6,
    dist_niassa_mandimba: 2,
    dist_niassa_sanga: 4,
    dist_niassa_cuamba: 4,
    dist_niassa_mecanhelas: 2,
    dist_niassa_mecula: 2,
    dist_niassa_lago: 5,
    dist_niassa_nipepe: 2,
    dist_niassa_maua: 2,
    dist_niassa_metarica: 2,
    dist_niassa_muembe: 2,
    dist_niassa_mavago: 2,
    dist_niassa_marrupa: 3,
    dist_niassa_ngauma: 2,
    dist_niassa_chimbunila: 2,
    dist_niassa_majune: 3,

    // Maputo Province
    dist_maputo_matola: 3,
    dist_maputo_boane: 2,
    dist_maputo_magude: 5,
    dist_maputo_manhica: 6,
    dist_maputo_marracuene: 2,
    dist_maputo_matutuine: 5,
    dist_maputo_moamba: 4,
    dist_maputo_namaacha: 2,

    // Nampula
    dist_nampula_nampula: 7,
    dist_nampula_angoche: 4,
    dist_nampula_erati: 3,
    dist_nampula_ilha_de_mocambique: 2,
    dist_nampula_lalaua: 2,
    dist_nampula_malema: 3,
    dist_nampula_meconta: 4,
    dist_nampula_mecuburi: 4,
    dist_nampula_memba: 4,
    dist_nampula_mogincual: 2,
    dist_nampula_mogovolas: 5,
    dist_nampula_moma: 2,
    dist_nampula_monapo: 3,
    dist_nampula_mossuril: 3,
    dist_nampula_muecate: 3,
    dist_nampula_murrupula: 3,
    dist_nampula_nacala_porto: 2,
    dist_nampula_nacala_a_velha: 3,
    dist_nampula_nacaroa: 3,
    dist_nampula_rapale: 3,
    dist_nampula_ribaue: 3,
    dist_nampula_larde: 2,
    dist_nampula_liupo: 2,

    // Zambézia
    dist_zambezia_quelimane: 5,
    dist_zambezia_alto_molocue: 2,
    dist_zambezia_chinde: 2,
    dist_zambezia_gile: 2,
    dist_zambezia_gurue: 3,
    dist_zambezia_ile: 2,
    dist_zambezia_inhassunge: 2,
    dist_zambezia_lugela: 4,
    dist_zambezia_maganja_da_costa: 2,
    dist_zambezia_milange: 3,
    dist_zambezia_mocuba: 3,
    dist_zambezia_mopeia: 2,
    dist_zambezia_morrumbala: 3,
    dist_zambezia_namacurra: 2,
    dist_zambezia_namarroi: 2,
    dist_zambezia_nicoadala: 2,
    dist_zambezia_pebane: 3,
    dist_zambezia_derre: 2,
    dist_zambezia_luabo: 2,
    dist_zambezia_mocubela: 2,
    dist_zambezia_molumbo: 2,
    dist_zambezia_mulevala: 2,

    // Tete
    dist_tete_angonia: 2,
    dist_tete_cahora_bassa: 3,
    dist_tete_changara: 2,
    dist_tete_chifunde: 3,
    dist_tete_chiuta: 2,
    dist_tete_macanga: 2,
    dist_tete_magoe: 3,
    dist_tete_maravia: 4,
    dist_tete_moatize: 3,
    dist_tete_mutarara: 3,
    dist_tete_tsangano: 2,
    dist_tete_zumbo: 3,
    dist_tete_doa: 2,
    dist_tete_marara: 2,
  };

const errors: string[] = [];
const warnings: string[] = [];

async function readJson<T>(
  filePath: string
): Promise<T> {
  const content = await readFile(
    filePath,
    "utf8"
  );

  return JSON.parse(content) as T;
}

function findDuplicates(
  values: string[]
): string[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(
      value,
      (counts.get(value) ?? 0) + 1
    );
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function reportDuplicateValues(
  label: string,
  values: string[]
) {
  const duplicates =
    findDuplicates(values);

  for (const duplicate of duplicates) {
    errors.push(
      `${label} duplicated: "${duplicate}"`
    );
  }
}

function validateProvinceData(
  provinces: Province[]
) {
  console.log(
    "🔎 Validating provinces..."
  );

  if (provinces.length !== 11) {
    errors.push(
      `Expected 11 provinces, found ${provinces.length}.`
    );
  }

  reportDuplicateValues(
    "Province ID",
    provinces.map(
      (province) => province.id
    )
  );

  reportDuplicateValues(
    "Province slug",
    provinces.map(
      (province) => province.slug
    )
  );

  const provinceCodes =
    provinces
      .map(
        (province) =>
          province.code
      )
      .filter(
        (code): code is string =>
          code !== null
      );

  reportDuplicateValues(
    "Province code",
    provinceCodes
  );

  for (const province of provinces) {
    if (!province.id.trim()) {
      errors.push(
        "Province found with empty ID."
      );
    }

    if (!province.name.trim()) {
      errors.push(
        `Province "${province.id}" has an empty name.`
      );
    }

    if (!province.slug.trim()) {
      errors.push(
        `Province "${province.id}" has an empty slug.`
      );
    }
  }

  console.log(
    `   ✅ ${provinces.length} province(s) checked.`
  );
}

function validateDistrictData(
  districts: District[],
  provinces: Province[]
) {
  console.log(
    "🔎 Validating districts..."
  );

  const provinceIds =
    new Set(
      provinces.map(
        (province) => province.id
      )
    );

  if (districts.length !== 161) {
    errors.push(
      `Expected 161 districts/territorial equivalents, found ${districts.length}.`
    );
  }

  reportDuplicateValues(
    "District ID",
    districts.map(
      (district) => district.id
    )
  );

  const districtCodes =
    districts
      .map(
        (district) =>
          district.code
      )
      .filter(
        (code): code is string =>
          code !== null
      );

  reportDuplicateValues(
    "District code",
    districtCodes
  );

  /*
   * O endpoint global atual resolve:
   *
   * /api/v1/districts/:identifier
   *
   * usando ID ou slug.
   * Portanto os slugs distritais precisam ser
   * únicos nacionalmente enquanto essa API existir.
   */
  reportDuplicateValues(
    "Global district slug",
    districts.map(
      (district) => district.slug
    )
  );

  reportDuplicateValues(
    "District province/slug pair",
    districts.map(
      (district) =>
        `${district.provinceId}:${district.slug}`
    )
  );

  for (const district of districts) {
    if (!district.id.trim()) {
      errors.push(
        "District found with empty ID."
      );
    }

    if (!district.name.trim()) {
      errors.push(
        `District "${district.id}" has an empty name.`
      );
    }

    if (!district.slug.trim()) {
      errors.push(
        `District "${district.id}" has an empty slug.`
      );
    }

    if (
      !provinceIds.has(
        district.provinceId
      )
    ) {
      errors.push(
        `District "${district.id}" references unknown province "${district.provinceId}".`
      );
    }

    if (
      district.type !== undefined &&
      district.type !==
        "DISTRICT" &&
      district.type !==
        "MUNICIPAL_DISTRICT"
    ) {
      errors.push(
        `District "${district.id}" has invalid type "${district.type}".`
      );
    }

    if (
      district.provinceId ===
        "prov_11" &&
      district.type !==
        "MUNICIPAL_DISTRICT"
    ) {
      errors.push(
        `Maputo City unit "${district.id}" must have type "MUNICIPAL_DISTRICT".`
      );
    }

    if (
      district.provinceId !==
        "prov_11" &&
      district.type ===
        "MUNICIPAL_DISTRICT"
    ) {
      errors.push(
        `District "${district.id}" is outside Maputo City but is marked as MUNICIPAL_DISTRICT.`
      );
    }
  }

  console.log(
    `   ✅ ${districts.length} district(s) checked.`
  );
}

function validateDistrictCounts(
  districts: District[],
  provinces: Province[]
) {
  console.log(
    "🔎 Validating district counts by province..."
  );

  const counts =
    new Map<string, number>();

  for (const district of districts) {
    counts.set(
      district.provinceId,
      (
        counts.get(
          district.provinceId
        ) ?? 0
      ) + 1
    );
  }

  for (const province of provinces) {
    const actual =
      counts.get(
        province.id
      ) ?? 0;

    const expected =
      expectedDistrictCounts[
        province.id
      ];

    if (
      expected === undefined
    ) {
      warnings.push(
        `No expected district count configured for "${province.name}".`
      );

      continue;
    }

    if (actual !== expected) {
      errors.push(
        `${province.name}: expected ${expected} districts, found ${actual}.`
      );
    }

    console.log(
      `   ${
        actual === expected
          ? "✅"
          : "❌"
      } ${province.name}: ${actual}/${expected}`
    );
  }
}

function validateAdministrativePosts(
  administrativePosts:
    AdministrativePost[],
  districts: District[]
) {
  console.log(
    "🔎 Validating administrative posts..."
  );

  const districtIds =
    new Set(
      districts.map(
        (district) => district.id
      )
    );

  reportDuplicateValues(
    "Administrative post ID",
    administrativePosts.map(
      (post) => post.id
    )
  );

  const codes =
    administrativePosts
      .map(
        (post) => post.code
      )
      .filter(
        (code): code is string =>
          code !== null
      );

  reportDuplicateValues(
    "Administrative post code",
    codes
  );

  /*
   * O slug NÃO precisa ser único nacionalmente.
   *
   * A regra correta é:
   *
   * distrito + slug
   *
   * porque dois distritos diferentes podem ter
   * postos administrativos com o mesmo nome.
   */
  reportDuplicateValues(
    "Administrative post district/slug pair",
    administrativePosts.map(
      (post) =>
        `${post.districtId}:${post.slug}`
    )
  );

  for (
    const post of
    administrativePosts
  ) {
    if (!post.id.trim()) {
      errors.push(
        "Administrative post found with empty ID."
      );
    }

    if (!post.name.trim()) {
      errors.push(
        `Administrative post "${post.id}" has an empty name.`
      );
    }

    if (!post.slug.trim()) {
      errors.push(
        `Administrative post "${post.id}" has an empty slug.`
      );
    }

    if (
      !districtIds.has(
        post.districtId
      )
    ) {
      errors.push(
        `Administrative post "${post.id}" references unknown district "${post.districtId}".`
      );
    }
  }

  console.log(
    `   ✅ ${administrativePosts.length} administrative post(s) checked.`
  );
}

function validateAdministrativePostCountsByDistrict(
  administrativePosts:
    AdministrativePost[],
  districts: District[]
) {
  console.log(
    "🔎 Validating administrative post counts by district..."
  );

  const counts =
    new Map<string, number>();

  for (
    const post of
    administrativePosts
  ) {
    counts.set(
      post.districtId,
      (
        counts.get(
          post.districtId
        ) ?? 0
      ) + 1
    );
  }

  const districtById =
    new Map(
      districts.map(
        (district) => [
          district.id,
          district
        ]
      )
    );

  for (
    const [
      districtId,
      expected
    ] of Object.entries(
      expectedAdministrativePostCountsByDistrict
    )
  ) {
    const actual =
      counts.get(
        districtId
      ) ?? 0;

    const district =
      districtById.get(
        districtId
      );

    if (actual !== expected) {
      errors.push(
        `${district?.name ?? districtId}: expected ${expected} administrative posts, found ${actual}.`
      );
    }

    console.log(
      `   ${
        actual === expected
          ? "✅"
          : "❌"
      } ${
        district?.name ??
        districtId
      }: ${actual}/${expected}`
    );
  }
}

function validateAdministrativePostCountsByProvince(
  administrativePosts:
    AdministrativePost[],
  districts: District[],
  provinces: Province[]
) {
  console.log(
    "🔎 Validating administrative post counts by completed province..."
  );

  const districtToProvince =
    new Map(
      districts.map(
        (district) => [
          district.id,
          district.provinceId
        ]
      )
    );

  const counts =
    new Map<string, number>();

  for (
    const post of
    administrativePosts
  ) {
    const provinceId =
      districtToProvince.get(
        post.districtId
      );

    if (!provinceId) {
      continue;
    }

    counts.set(
      provinceId,
      (
        counts.get(
          provinceId
        ) ?? 0
      ) + 1
    );
  }

  const provinceById =
    new Map(
      provinces.map(
        (province) => [
          province.id,
          province
        ]
      )
    );

  for (
    const [
      provinceId,
      expected
    ] of Object.entries(
      expectedAdministrativePostCountsByProvince
    )
  ) {
    const actual =
      counts.get(
        provinceId
      ) ?? 0;

    const province =
      provinceById.get(
        provinceId
      );

    if (actual !== expected) {
      errors.push(
        `${province?.name ?? provinceId}: expected ${expected} administrative posts, found ${actual}.`
      );
    }

    console.log(
      `   ${
        actual === expected
          ? "✅"
          : "❌"
      } ${
        province?.name ??
        provinceId
      }: ${actual}/${expected}`
    );
  }
}

function validateSources(
  sources: Source[]
) {
  console.log(
    "🔎 Validating sources..."
  );

  reportDuplicateValues(
    "Source ID",
    sources.map(
      (source) => source.id
    )
  );

  for (const source of sources) {
    if (!source.id.trim()) {
      errors.push(
        "Source found with empty ID."
      );
    }

    if (
      !source.institution.trim()
    ) {
      errors.push(
        `Source "${source.id}" has an empty institution.`
      );
    }

    if (!source.title.trim()) {
      errors.push(
        `Source "${source.id}" has an empty title.`
      );
    }

    if (
      source.type !==
        "OFFICIAL" &&
      source.type !==
        "SECONDARY"
    ) {
      errors.push(
        `Source "${source.id}" has invalid type "${source.type}".`
      );
    }
  }

  console.log(
    `   ✅ ${sources.length} source(s) checked.`
  );
}

function validateDistrictSources(
  districtSources:
    DistrictSource[],
  districts: District[],
  sources: Source[]
) {
  console.log(
    "🔎 Validating district source references..."
  );

  const districtIds =
    new Set(
      districts.map(
        (district) => district.id
      )
    );

  const sourceIds =
    new Set(
      sources.map(
        (source) => source.id
      )
    );

  reportDuplicateValues(
    "District/source reference",
    districtSources.map(
      (reference) =>
        `${reference.districtId}:${reference.sourceId}`
    )
  );

  for (
    const reference of
    districtSources
  ) {
    if (
      !districtIds.has(
        reference.districtId
      )
    ) {
      errors.push(
        `District source references unknown district "${reference.districtId}".`
      );
    }

    if (
      !sourceIds.has(
        reference.sourceId
      )
    ) {
      errors.push(
        `District source references unknown source "${reference.sourceId}".`
      );
    }
  }

  const sourcedDistricts =
    new Set(
      districtSources.map(
        (reference) =>
          reference.districtId
      )
    );

  for (
    const district of districts
  ) {
    if (
      !sourcedDistricts.has(
        district.id
      )
    ) {
      errors.push(
        `District "${district.id}" has no source reference.`
      );
    }
  }

  console.log(
    `   ✅ ${districtSources.length} district source reference(s) checked.`
  );
}

function validateAdministrativePostSources(
  administrativePostSources:
    AdministrativePostSource[],
  administrativePosts:
    AdministrativePost[],
  sources: Source[]
) {
  console.log(
    "🔎 Validating administrative post source references..."
  );

  const postIds =
    new Set(
      administrativePosts.map(
        (post) => post.id
      )
    );

  const sourceIds =
    new Set(
      sources.map(
        (source) => source.id
      )
    );

  reportDuplicateValues(
    "Administrative post/source reference",
    administrativePostSources.map(
      (reference) =>
        `${reference.administrativePostId}:${reference.sourceId}`
    )
  );

  for (
    const reference of
    administrativePostSources
  ) {
    if (
      !postIds.has(
        reference.administrativePostId
      )
    ) {
      errors.push(
        `Administrative post source references unknown administrative post "${reference.administrativePostId}".`
      );
    }

    if (
      !sourceIds.has(
        reference.sourceId
      )
    ) {
      errors.push(
        `Administrative post source references unknown source "${reference.sourceId}".`
      );
    }
  }

  const sourcedPosts =
    new Set(
      administrativePostSources.map(
        (reference) =>
          reference.administrativePostId
      )
    );

  for (
    const post of
    administrativePosts
  ) {
    if (
      !sourcedPosts.has(
        post.id
      )
    ) {
      errors.push(
        `Administrative post "${post.id}" has no source reference.`
      );
    }
  }

  console.log(
    `   ✅ ${administrativePostSources.length} administrative post source reference(s) checked.`
  );
}

async function main() {
  console.log(
    "\n🇲🇿 moz-address-api — Data validation\n"
  );

  try {
    const [
      provinces,
      districts,
      administrativePosts,
      sources,
      districtSources,
      administrativePostSources
    ] = await Promise.all([
      readJson<Province[]>(
        paths.provinces
      ),

      readJson<District[]>(
        paths.districts
      ),

      readJson<
        AdministrativePost[]
      >(
        paths.administrativePosts
      ),

      readJson<Source[]>(
        paths.sources
      ),

      readJson<
        DistrictSource[]
      >(
        paths.districtSources
      ),

      readJson<
        AdministrativePostSource[]
      >(
        paths.administrativePostSources
      )
    ]);

    validateProvinceData(
      provinces
    );

    validateDistrictData(
      districts,
      provinces
    );

    validateDistrictCounts(
      districts,
      provinces
    );

    validateAdministrativePosts(
      administrativePosts,
      districts
    );

    validateAdministrativePostCountsByDistrict(
      administrativePosts,
      districts
    );

    validateAdministrativePostCountsByProvince(
      administrativePosts,
      districts,
      provinces
    );

    validateSources(
      sources
    );

    validateDistrictSources(
      districtSources,
      districts,
      sources
    );

    validateAdministrativePostSources(
      administrativePostSources,
      administrativePosts,
      sources
    );

    console.log(
      "\n📊 Dataset summary"
    );

    console.log(
      `   Provinces: ${provinces.length}`
    );

    console.log(
      `   Districts: ${districts.length}`
    );

    console.log(
      `   Administrative posts: ${administrativePosts.length}`
    );

    console.log(
      `   Sources: ${sources.length}`
    );

    console.log(
      `   District source references: ${districtSources.length}`
    );

    console.log(
      `   Administrative post source references: ${administrativePostSources.length}`
    );

    if (
      warnings.length > 0
    ) {
      console.log(
        "\n⚠️ Warnings"
      );

      for (
        const warning of
        warnings
      ) {
        console.log(
          `   - ${warning}`
        );
      }
    }

    if (
      errors.length > 0
    ) {
      console.error(
        `\n❌ Validation failed with ${errors.length} error(s):\n`
      );

      for (
        const error of
        errors
      ) {
        console.error(
          `   - ${error}`
        );
      }

      process.exitCode = 1;

      return;
    }

    console.log(
      "\n✅ Dataset validation passed successfully.\n"
    );
  } catch (error) {
    console.error(
      "\n❌ Unable to validate dataset."
    );

    console.error(error);

    process.exitCode = 1;
  }
}

await main();
