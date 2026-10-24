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

type Locality = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  type: "LOCALITY" | "NEIGHBORHOOD";
  administrativePostId: string | null;
  districtId: string | null;
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

type LocalitySource = {
  localityId: string;
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

  localities: path.join(
    rootDir,
    "data",
    "current",
    "localities.json"
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
  ),

  localitySources: path.join(
    rootDir,
    "data",
    "sources",
    "locality-sources.json"
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
 * Contagens provinciais já verificadas
 * ao nível de postos administrativos.
 *
 * Cabo Delgado permanece temporariamente
 * fora desta lista devido a divergências
 * documentais nas fontes oficiais.
 */
const expectedAdministrativePostCountsByProvince:
  Record<string, number> = {
    prov_01: 45,
    prov_02: 56,
    prov_03: 72,
    prov_04: 54,
    prov_05: 36,
    prov_06: 37,
    prov_07: 38,
    prov_08: 26,
    prov_09: 50,
    prov_10: 29,
    prov_11: 0
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

    // Cabo Delgado
    dist_cabo_delgado_pemba: 0,
    dist_cabo_delgado_ancuabe: 3,
    dist_cabo_delgado_balama: 4,
    dist_cabo_delgado_chiure: 6,
    dist_cabo_delgado_ibo: 2,
    dist_cabo_delgado_macomia: 4,
    dist_cabo_delgado_mecufi: 2,
    dist_cabo_delgado_meluco: 2,
    dist_cabo_delgado_metuge: 2,
    dist_cabo_delgado_mocimboa_da_praia: 3,
    dist_cabo_delgado_montepuez: 5,
    dist_cabo_delgado_mueda: 5,
    dist_cabo_delgado_muidumbe: 3,
    dist_cabo_delgado_namuno: 6,
    dist_cabo_delgado_nangade: 2,
    dist_cabo_delgado_palma: 4,
    dist_cabo_delgado_quissanga: 3,

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
    dist_zambezia_quelimane: 6,
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
    dist_zambezia_nicoadala: 1,
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

    // Manica
    dist_manica_chimoio: 3,
    dist_manica_barue: 3,
    dist_manica_gondola: 4,
    dist_manica_guro: 4,
    dist_manica_machaze: 2,
    dist_manica_macossa: 3,
    dist_manica_manica: 4,
    dist_manica_mossurize: 3,
    dist_manica_sussundenga: 4,
    dist_manica_tambara: 3,
    dist_manica_macate: 2,
    dist_manica_vanduzi: 2,

    // Sofala
    dist_sofala_beira: 5,
    dist_sofala_buzi: 3,
    dist_sofala_caia: 3,
    dist_sofala_chemba: 3,
    dist_sofala_cheringoma: 2,
    dist_sofala_chibabava: 3,
    dist_sofala_dondo: 3,
    dist_sofala_gorongosa: 3,
    dist_sofala_machanga: 3,
    dist_sofala_maringue: 3,
    dist_sofala_marromeu: 3,
    dist_sofala_muanza: 2,
    dist_sofala_nhamatanda: 2,

    // Inhambane
    dist_inhambane_funhalouro: 2,
    dist_inhambane_govuro: 2,
    dist_inhambane_homoine: 2,
    dist_inhambane_inharrime: 2,
    dist_inhambane_inhassoro: 2,
    dist_inhambane_jangamo: 2,
    dist_inhambane_mabote: 3,
    dist_inhambane_massinga: 2,
    dist_inhambane_morrumbene: 2,
    dist_inhambane_panda: 3,
    dist_inhambane_vilankulo: 2,
    dist_inhambane_zavala: 2,

    // Gaza
    dist_gaza_xai_xai: 5,
    dist_gaza_bilene: 6,
    dist_gaza_chibuto: 6,
    dist_gaza_chicualacuala: 2,
    dist_gaza_chigubo: 2,
    dist_gaza_chokwe: 4,
    dist_gaza_guija: 4,
    dist_gaza_mabalane: 3,
    dist_gaza_mandlakazi: 5,
    dist_gaza_massangena: 2,
    dist_gaza_massingir: 3,
    dist_gaza_limpopo: 3,
    dist_gaza_chongoene: 3,
    dist_gaza_mapai: 2,

    // Cidade de Maputo
    dist_maputo_city_kampfumu: 0,
    dist_maputo_city_nlhamankulu: 0,
    dist_maputo_city_kamaxakeni: 0,
    dist_maputo_city_kamavota: 0,
    dist_maputo_city_kamubukwana: 0,
    dist_maputo_city_katembe: 0,
    dist_maputo_city_kanyaka: 0
  };

const expectedNeighborhoodCountsByDistrict:
  Record<string, number> = {
    dist_maputo_city_kampfumu: 11,
    dist_maputo_city_nlhamankulu: 11,
    dist_maputo_city_kamaxakeni: 8,
    dist_maputo_city_kamavota: 11,
    dist_maputo_city_kamubukwana: 14,
    dist_maputo_city_katembe: 5,
    dist_maputo_city_kanyaka: 3
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

function validateLocalityData(
  localities: Locality[],
  administrativePosts:
    AdministrativePost[],
  districts: District[]
) {
  console.log(
    "🔎 Validating localities and neighborhoods..."
  );

  const administrativePostIds =
    new Set(
      administrativePosts.map(
        (post) => post.id
      )
    );

  const districtMap =
    new Map(
      districts.map(
        (district) => [
          district.id,
          district
        ]
      )
    );

  reportDuplicateValues(
    "Locality ID",
    localities.map(
      (locality) => locality.id
    )
  );

  const localityCodes =
    localities
      .map(
        (locality) =>
          locality.code
      )
      .filter(
        (code): code is string =>
          code !== null
      );

  reportDuplicateValues(
    "Locality code",
    localityCodes
  );

  reportDuplicateValues(
    "Administrative post/locality slug pair",
    localities
      .filter(
        (locality) =>
          locality.administrativePostId !==
          null
      )
      .map(
        (locality) =>
          `${locality.administrativePostId}:${locality.slug}`
      )
  );

  reportDuplicateValues(
    "District/neighborhood slug pair",
    localities
      .filter(
        (locality) =>
          locality.districtId !==
          null
      )
      .map(
        (locality) =>
          `${locality.districtId}:${locality.slug}`
      )
  );

  for (
    const locality of localities
  ) {
    if (!locality.id.trim()) {
      errors.push(
        "Locality found with empty ID."
      );
    }

    if (!locality.name.trim()) {
      errors.push(
        `Locality "${locality.id}" has an empty name.`
      );
    }

    if (!locality.slug.trim()) {
      errors.push(
        `Locality "${locality.id}" has an empty slug.`
      );
    }

    if (
      locality.type !==
        "LOCALITY" &&
      locality.type !==
        "NEIGHBORHOOD"
    ) {
      errors.push(
        `Locality "${locality.id}" has invalid type "${locality.type}".`
      );

      continue;
    }

    const hasAdministrativePost =
      locality.administrativePostId !==
      null;

    const hasDistrict =
      locality.districtId !== null;

    /*
     * XOR: exatamente um pai.
     */
    if (
      hasAdministrativePost ===
      hasDistrict
    ) {
      errors.push(
        `Locality "${locality.id}" must reference exactly one parent: administrativePostId OR districtId.`
      );
    }

    if (
      locality.type ===
      "LOCALITY"
    ) {
      if (!hasAdministrativePost) {
        errors.push(
          `LOCALITY "${locality.id}" must reference an administrative post.`
        );
      }

      if (hasDistrict) {
        errors.push(
          `LOCALITY "${locality.id}" must not reference a district directly.`
        );
      }

      if (
        locality.administrativePostId !==
          null &&
        !administrativePostIds.has(
          locality.administrativePostId
        )
      ) {
        errors.push(
          `LOCALITY "${locality.id}" references unknown administrative post "${locality.administrativePostId}".`
        );
      }
    }

    if (
      locality.type ===
      "NEIGHBORHOOD"
    ) {
      if (!hasDistrict) {
        errors.push(
          `NEIGHBORHOOD "${locality.id}" must reference a district.`
        );
      }

      if (hasAdministrativePost) {
        errors.push(
          `NEIGHBORHOOD "${locality.id}" must not reference an administrative post.`
        );
      }

      if (
        locality.districtId !== null
      ) {
        const district =
          districtMap.get(
            locality.districtId
          );

        if (!district) {
          errors.push(
            `NEIGHBORHOOD "${locality.id}" references unknown district "${locality.districtId}".`
          );
        } else if (
          district.type !==
          "MUNICIPAL_DISTRICT"
        ) {
          errors.push(
            `NEIGHBORHOOD "${locality.id}" must belong to a MUNICIPAL_DISTRICT, but "${district.id}" has type "${district.type ?? "DISTRICT"}".`
          );
        }
      }
    }
  }

  const localityCount =
    localities.filter(
      (locality) =>
        locality.type ===
        "LOCALITY"
    ).length;

  const neighborhoodCount =
    localities.filter(
      (locality) =>
        locality.type ===
        "NEIGHBORHOOD"
    ).length;

  console.log(
    `   ✅ ${localities.length} record(s) checked (${localityCount} localities, ${neighborhoodCount} neighborhoods).`
  );
}

function validateNeighborhoodCountsByDistrict(
  localities: Locality[],
  districts: District[]
) {
  console.log(
    "🔎 Validating neighborhood counts by district..."
  );

  const districtMap = new Map(
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
      expectedCount
    ] of Object.entries(
      expectedNeighborhoodCountsByDistrict
    )
  ) {
    const district =
      districtMap.get(districtId);

    if (!district) {
      errors.push(
        `Neighborhood count configuration references unknown district "${districtId}".`
      );

      continue;
    }

    const actualCount =
      localities.filter(
        (locality) =>
          locality.type ===
            "NEIGHBORHOOD" &&
          locality.districtId ===
            districtId
      ).length;

    if (
      actualCount !== expectedCount
    ) {
      errors.push(
        `District "${district.name}" expected ${expectedCount} neighborhood(s), found ${actualCount}.`
      );
    } else {
      console.log(
        `   ✅ ${district.name}: ${actualCount}/${expectedCount}`
      );
    }
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

function validateLocalitySourceReferences(
  localitySources:
    LocalitySource[],
  localities: Locality[],
  sources: Source[]
) {
  console.log(
    "🔎 Validating locality source references..."
  );

  const localityIds =
    new Set(
      localities.map(
        (locality) => locality.id
      )
    );

  const sourceIds =
    new Set(
      sources.map(
        (source) => source.id
      )
    );

  reportDuplicateValues(
    "Locality/source reference",
    localitySources.map(
      (reference) =>
        `${reference.localityId}:${reference.sourceId}`
    )
  );

  for (
    const reference of
    localitySources
  ) {
    if (
      !localityIds.has(
        reference.localityId
      )
    ) {
      errors.push(
        `Locality source reference points to unknown locality "${reference.localityId}".`
      );
    }

    if (
      !sourceIds.has(
        reference.sourceId
      )
    ) {
      errors.push(
        `Locality source reference "${reference.localityId}" points to unknown source "${reference.sourceId}".`
      );
    }
  }

  const localitiesWithSources =
    new Set(
      localitySources.map(
        (reference) =>
          reference.localityId
      )
    );

  for (
    const locality of localities
  ) {
    if (
      !localitiesWithSources.has(
        locality.id
      )
    ) {
      errors.push(
        `Locality "${locality.id}" has no source reference.`
      );
    }
  }

  console.log(
    `   ✅ ${localitySources.length} locality source reference(s) checked.`
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
      localities,
      sources,
      districtSources,
      administrativePostSources,
      localitySources
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

      readJson<Locality[]>(
        paths.localities
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
      ),

      readJson<
        LocalitySource[]
      >(
        paths.localitySources
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

    validateNeighborhoodCountsByDistrict(
      localities,
      districts
    );

    validateLocalityData(
      localities,
      administrativePosts,
      districts
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

    validateLocalitySourceReferences(
      localitySources,
      localities,
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
      `   Localities / neighborhoods: ${localities.length}`
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

    console.log(
      `   Locality source references: ${localitySources.length}`
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
