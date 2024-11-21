import { Client } from "@elastic/elasticsearch";

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
});

export async function initializeElasticsearch() {
  try {
    await waitForElasticsearch();

    await client.indices.create({
      index: "products",
      body: {
        mappings: {
          properties: {
            id: { type: "keyword" },
            name: {
              type: "text",
              analyzer: "standard", // Default analyzer for basic tokenization
              fields: {
                exact: { type: "keyword" }, // Exact match
                partial: {
                  type: "text",
                  analyzer: "simple", // Partial matches based on words
                },
                autocomplete: {
                  type: "text",
                  analyzer: "edge_ngram_analyzer", // Edge n-gram for autocomplete
                  search_analyzer: "standard", // Standard analyzer for searching
                },
              },
            },
            categories: {
              type: "text",
              analyzer: "standard",
              fields: {
                exact: { type: "keyword" }, // Exact match
                partial: {
                  type: "text",
                  analyzer: "simple", // Partial matches
                },
                autocomplete: {
                  type: "text",
                  analyzer: "edge_ngram_analyzer", // Edge n-gram for autocomplete
                  search_analyzer: "standard", // Standard analyzer for searching
                },
              },
            },
            aisleNumber: { type: "integer" },
          },
        },
        settings: {
          analysis: {
            tokenizer: {
              edge_ngram_tokenizer: {
                type: "edge_ngram",
                min_gram: 2,
                max_gram: 20,
                token_chars: ["letter", "digit"],
              },
            },
            analyzer: {
              edge_ngram_analyzer: {
                type: "custom",
                tokenizer: "edge_ngram_tokenizer",
                filter: ["lowercase"], // Ensures case-insensitive matching
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (!error.message.includes("resource_already_exists_exception")) {
      console.error("Error initializing Elasticsearch:", error);
    }
  }
}

async function waitForElasticsearch(retries = 5, interval = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.ping();
      console.log("Successfully connected to Elasticsearch");
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Waiting for Elasticsearch... (${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}

export async function indexProducts(products) {
  const operations = products.flatMap((doc) => [
    { index: { _index: "products" } },
    doc,
  ]);

  try {
    await client.bulk({ refresh: true, operations });
  } catch (error) {
    console.error("Error indexing products:", error);
  }
}

export async function searchProducts(query, page = 1, limit = 12) {
  const from = (page - 1) * limit;

  const searchQuery = query
    ? {
        bool: {
          should: [
            {
              match_phrase: {
                "name.exact": {
                  query,
                  boost: 10, // Higher priority for exact matches
                },
              },
            },
            {
              match_phrase: {
                "categories.exact": {
                  query,
                  boost: 8,
                },
              },
            },
            {
              match: {
                "name.autocomplete": {
                  query,
                  boost: 5, // Prioritize autocomplete matches
                },
              },
            },
            {
              match: {
                "categories.autocomplete": {
                  query,
                  boost: 4,
                },
              },
            },
            {
              multi_match: {
                query,
                fields: ["name^2", "categories"],
                fuzziness: "AUTO", // Fuzzy search for fallback
                boost: 1,
              },
            },
          ],
        },
      }
    : { match_all: {} };

  try {
    const { hits } = await client.search({
      index: "products",
      body: {
        from,
        size: limit,
        query: searchQuery,
      },
    });

    return {
      products: hits.hits.map((hit) => ({
        ...hit._source,
        score: hit._score,
      })),
      total: hits.total.value,
    };
  } catch (error) {
    console.error("Error searching products:", error.message);
    return { products: [], total: 0 };
  }
}

export async function clearIndex() {
  try {
    await client.indices.delete({ index: "products" });
  } catch (error) {
    console.error("Error clearing index:", error);
  }
}
