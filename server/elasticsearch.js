import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true
});

export async function initializeElasticsearch() {
	try {
		// Wait for Elasticsearch to be ready
		await waitForElasticsearch();

		await client.indices.create({
			index: 'products',
			body: {
				mappings: {
					properties: {
						id: { type: 'keyword' },
						name: {
							type: 'text',
							analyzer: 'english', // Full-text search for longer queries
							fields: {
								exact: { type: 'keyword' }, // Whole-field exact match
								partial_exact: {
									// Tokenized for individual word matches
									type: 'text',
									analyzer: 'simple', // Tokenized into individual words
								},
								raw: {
									type: 'text',
									analyzer: 'edge_ngram_analyzer', // Use edge ngram analyzer
								},
							},
						},
						categories: {
							type: 'text',
							analyzer: 'english', // Full-text search
							fields: {
								exact: { type: 'keyword' }, // Whole-field exact match
								partial_exact: {
									type: 'text',
									analyzer: 'simple',
								}, // Tokenized exact match
								raw: {
									type: 'text',
									analyzer: 'edge_ngram_analyzer', // Use edge ngram analyzer for categories
								},
							},
						},
						aisleNumber: { type: 'integer' },
					},
				},
				settings: {
					analysis: {
						tokenizer: {
							edge_ngram_tokenizer: {
								type: 'edge_ngram',
								min_gram: 1, // Minimum length of token
								max_gram: 25, // Maximum length of token
								token_chars: ['letter', 'digit'],
							},
						},
						analyzer: {
							edge_ngram_analyzer: {
								type: 'custom',
								tokenizer: 'edge_ngram_tokenizer', // Use the edge_ngram tokenizer
							},
						},
					},
				},
			},
		});
	} catch (error) {
		if (!error.message.includes('resource_already_exists_exception')) {
			console.error('Error initializing Elasticsearch:', error);
		}
	}
}

async function waitForElasticsearch(retries = 5, interval = 5000) {
	for (let i = 0; i < retries; i++) {
		try {
			await client.ping();
			console.log('Successfully connected to Elasticsearch');
			return;
		} catch (error) {
			if (i === retries - 1) throw error;
			console.log(`Waiting for Elasticsearch... (${i + 1}/${retries})`);
			await new Promise(resolve => setTimeout(resolve, interval));
		}
	}
}

export async function indexProducts(products) {
	const operations = products.flatMap(doc => [
		{ index: { _index: 'products' } },
		doc,
	]);

	try {
		await client.bulk({ refresh: true, operations });
	} catch (error) {
		console.error('Error indexing products:', error);
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
								name: {
									query,
									boost: 5, // Exact match for product name
								},
							},
						},
						{
							match_phrase: {
								categories: {
									query,
									boost: 4, // Exact match for categories
								},
							},
						},
						{
							multi_match: {
								query,
								fields: ['name^2', 'categories'],
								fuzziness: 'AUTO', // Fuzzy search
								boost: 1, // Lower boost for fuzzy matches
							},
						},
					],
				},
		  }
		: { match_all: {} };

	try {
		const { hits } = await client.search({
			index: 'products',
			body: {
				from,
				size: limit,
				query: searchQuery,
			},
		});

		return {
			products: hits.hits.map(hit => ({
				...hit._source,
				score: hit._score,
			})),
			total: hits.total.value,
		};
	} catch (error) {
		console.error('Error searching products:', error.message);
		return { products: [], total: 0 };
	}
}


export async function clearIndex() {
  try {
    await client.indices.delete({ index: 'products' });
  } catch (error) {
    console.error('Error clearing index:', error);
  }
}