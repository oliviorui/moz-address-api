import type {
  FastifySchema
} from "fastify";

const paginationQueryProperties = {
  page: {
    type: "string",
    description:
      "Page number. Must be an integer greater than or equal to 1.",
    examples: ["1"]
  },

  limit: {
    type: "string",
    description:
      "Number of records per page. Must be between 1 and 100.",
    examples: ["20"]
  }
} as const;

const identifierParams = {
  type: "object",

  properties: {
    identifier: {
      type: "string",
      description:
        "Resource ID or slug."
    }
  },

  required: ["identifier"]
} as const;

const idParams = {
  type: "object",

  properties: {
    id: {
      type: "string",
      description:
        "Resource ID."
    }
  },

  required: ["id"]
} as const;

const genericSuccessResponse = {
  type: "object",
  additionalProperties: true
} as const;

const genericErrorResponse = {
  type: "object",

  properties: {
    error: {
      type: "string"
    },

    message: {
      type: "string"
    }
  },

  required: [
    "error",
    "message"
  ],

  additionalProperties: true
} as const;

export const provinceRouteSchemas = {
  list: {
    tags: ["Provinces"],
    summary: "List provinces",
    description:
      "Lists provinces and Maputo City with optional search, type filter and pagination.",

    querystring: {
      type: "object",

      properties: {
        q: {
          type: "string",
          description:
            "Search by province name, slug or capital."
        },

        type: {
          type: "string",
          description:
            "Province type: PROVINCE or CAPITAL_CITY.",
          examples: ["PROVINCE"]
        },

        ...paginationQueryProperties
      }
    },

    response: {
      200: genericSuccessResponse,
      400: genericErrorResponse
    }
  },

  detail: {
    tags: ["Provinces"],
    summary: "Get province",
    description:
      "Returns one province or Maputo City by ID or slug.",
    params: identifierParams,

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  },

  districts: {
    tags: ["Provinces"],
    summary:
      "List districts in a province",
    description:
      "Returns all active districts or municipal districts belonging to the selected province.",
    params: identifierParams,

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  }
} satisfies Record<
  string,
  FastifySchema
>;

export const districtRouteSchemas = {
  list: {
    tags: ["Districts"],
    summary: "List districts",
    description:
      "Lists districts and municipal districts with optional search, province filter, type filter and pagination.",

    querystring: {
      type: "object",

      properties: {
        q: {
          type: "string",
          description:
            "Search by district name or slug."
        },

        province: {
          type: "string",
          description:
            "Filter by province ID or slug."
        },

        type: {
          type: "string",
          description:
            "District type: DISTRICT or MUNICIPAL_DISTRICT.",
          examples: ["DISTRICT"]
        },

        ...paginationQueryProperties
      }
    },

    response: {
      200: genericSuccessResponse,
      400: genericErrorResponse
    }
  },

  detail: {
    tags: ["Districts"],
    summary: "Get district",
    description:
      "Returns one district or municipal district by ID or slug.",
    params: identifierParams,

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  },

  administrativePosts: {
    tags: [
      "Administrative Posts"
    ],
    summary:
      "List administrative posts in a district",
    params: identifierParams,

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  },

  administrativePostDetail: {
    tags: [
      "Administrative Posts"
    ],
    summary:
      "Get administrative post in a district",

    params: {
      type: "object",

      properties: {
        identifier: {
          type: "string",
          description:
            "District ID or slug."
        },

        postSlug: {
          type: "string",
          description:
            "Administrative post slug."
        }
      },

      required: [
        "identifier",
        "postSlug"
      ]
    },

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  },

  neighborhoods: {
    tags: ["Localities"],
    summary:
      "List neighborhoods in a municipal district",
    description:
      "Neighborhoods are only available for municipal districts.",
    params: identifierParams,

    response: {
      200: genericSuccessResponse,
      400: genericErrorResponse,
      404: genericErrorResponse
    }
  },

  neighborhoodDetail: {
    tags: ["Localities"],
    summary:
      "Get neighborhood in a municipal district",

    params: {
      type: "object",

      properties: {
        identifier: {
          type: "string",
          description:
            "Municipal district ID or slug."
        },

        neighborhoodSlug: {
          type: "string",
          description:
            "Neighborhood slug."
        }
      },

      required: [
        "identifier",
        "neighborhoodSlug"
      ]
    },

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  }
} satisfies Record<
  string,
  FastifySchema
>;

export const administrativePostRouteSchemas = {
  list: {
    tags: [
      "Administrative Posts"
    ],
    summary:
      "List administrative posts",
    description:
      "Lists administrative posts with optional search, district/province filters and pagination.",

    querystring: {
      type: "object",

      properties: {
        q: {
          type: "string",
          description:
            "Search by administrative post name or slug."
        },

        district: {
          type: "string",
          description:
            "Filter by district ID or slug."
        },

        province: {
          type: "string",
          description:
            "Filter by province ID or slug."
        },

        ...paginationQueryProperties
      }
    },

    response: {
      200: genericSuccessResponse,
      400: genericErrorResponse
    }
  },

  detail: {
    tags: [
      "Administrative Posts"
    ],
    summary:
      "Get administrative post",
    description:
      "Returns one administrative post by ID.",
    params: idParams,

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  },

  localities: {
    tags: ["Localities"],
    summary:
      "List localities in an administrative post",
    params: idParams,

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  },

  localityDetail: {
    tags: ["Localities"],
    summary:
      "Get locality in an administrative post",

    params: {
      type: "object",

      properties: {
        id: {
          type: "string",
          description:
            "Administrative post ID."
        },

        localitySlug: {
          type: "string",
          description:
            "Locality slug."
        }
      },

      required: [
        "id",
        "localitySlug"
      ]
    },

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  }
} satisfies Record<
  string,
  FastifySchema
>;

export const localityRouteSchemas = {
  list: {
    tags: ["Localities"],
    summary:
      "List localities and neighborhoods",
    description:
      "Lists localities and neighborhoods with search, hierarchy filters, type filter and pagination.",

    querystring: {
      type: "object",

      properties: {
        q: {
          type: "string",
          description:
            "Search by locality/neighborhood name or slug."
        },

        type: {
          type: "string",
          description:
            "LOCALITY or NEIGHBORHOOD.",
          examples: ["NEIGHBORHOOD"]
        },

        district: {
          type: "string",
          description:
            "Filter by district ID or slug."
        },

        administrativePost: {
          type: "string",
          description:
            "Filter by administrative post ID or slug."
        },

        ...paginationQueryProperties
      }
    },

    response: {
      200: genericSuccessResponse,
      400: genericErrorResponse
    }
  },

  detail: {
    tags: ["Localities"],
    summary:
      "Get locality or neighborhood",
    description:
      "Returns one locality or neighborhood by ID.",
    params: idParams,

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  }
} satisfies Record<
  string,
  FastifySchema
>;

export const sourceRouteSchemas = {
  list: {
    tags: ["Sources"],
    summary:
      "List dataset sources",
    description:
      "Lists official and secondary dataset sources with search, filters and pagination.",

    querystring: {
      type: "object",

      properties: {
        q: {
          type: "string",
          description:
            "Search institution, title or notes."
        },

        type: {
          type: "string",
          description:
            "OFFICIAL or SECONDARY.",
          examples: ["OFFICIAL"]
        },

        institution: {
          type: "string",
          description:
            "Filter by institution name."
        },

        year: {
          type: "string",
          description:
            "Filter by publication/reference year.",
          examples: ["2024"]
        },

        ...paginationQueryProperties
      }
    },

    response: {
      200: genericSuccessResponse,
      400: genericErrorResponse
    }
  },

  detail: {
    tags: ["Sources"],
    summary:
      "Get dataset source",
    description:
      "Returns one source by ID.",
    params: idParams,

    response: {
      200: genericSuccessResponse,
      404: genericErrorResponse
    }
  }
} satisfies Record<
  string,
  FastifySchema
>;
