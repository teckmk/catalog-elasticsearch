import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import {
	initializeElasticsearch,
	indexProducts,
	searchProducts,
	clearIndex,
} from './elasticsearch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '../dist')));

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, join(__dirname, 'uploads'));
	},
	filename: function (req, file, cb) {
		cb(null, 'catalog.json');
	},
});

const upload = multer({ storage: storage });

// Initialize Elasticsearch
await initializeElasticsearch();

// Ensure uploads directory exists
await fs.mkdir(join(__dirname, 'uploads'), { recursive: true });

app.post('/api/upload', upload.single('file'), async (req, res) => {
	try {
		const fileContent = await fs.readFile(req.file.path, 'utf8');
		const catalogData = JSON.parse(fileContent);

		// Clear existing index and index new products
		await clearIndex();
		await initializeElasticsearch();

		const products = catalogData.flatMap(item =>
			item.products.map(product => ({
				...product,
				aisleNumber: item.aisleNumber,
				categories: [...product.categories, ...item.categories],
			}))
		);

		await indexProducts(products);
		res.json({ message: 'Catalog uploaded and indexed successfully' });
	} catch (error) {
		console.error('Error processing catalog:', error);
		res.status(400).json({ error: 'Error processing catalog' });
	}
});

app.get('/api/search', async (req, res) => {
	const { query = '', page = 1, limit = 12 } = req.query;
	const pageNum = parseInt(page);
	const limitNum = parseInt(limit);

	try {
		const { products, total } = await searchProducts(
			query,
			pageNum,
			limitNum
		);
		const totalPages = Math.ceil(total / limitNum);

		res.json({
			products,
			pagination: {
				currentPage: pageNum,
				totalPages,
				totalProducts: total,
				hasMore: pageNum < totalPages,
			},
		});
	} catch (error) {
		console.error('Error searching products:', error);
		res.status(500).json({ error: 'Error searching products' });
	}
});

// Handle all other routes by serving the index.html
app.get('*', (req, res) => {
	res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
