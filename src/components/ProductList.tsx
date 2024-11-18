import type { Product } from '../types';
import { MapPin, Star } from 'lucide-react';

interface ProductListProps {
	products: Product[];
}

export function ProductList({ products }: ProductListProps) {
	if (products.length === 0) {
		return (
			<div className="text-center text-gray-500 mt-8">
				No products found
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-7xl mt-8">
			{products.map(product => (
				<div
					key={product.id}
					className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
					<div className="flex items-start">
						<div className="flex-shrink-0 mr-4">
							<div className="bg-blue-100 rounded-lg p-3 text-center">
								<MapPin className="h-6 w-6 text-blue-600 mx-auto mb-1" />
								<span className="text-2xl font-bold text-blue-600">
									Aisle
								</span>
								<span className="text-2xl font-bold text-blue-600">
									{product.aisleNumber}
								</span>
							</div>
						</div>
						<div className="flex-grow">
							<div className="flex items-start justify-between mb-2">
								<div className="flex items-center">
									<h3 className="text-lg font-medium text-gray-900">
										{product.name}
									</h3>
								</div>
							</div>
							{product.score && (
								<div className="flex items-center mt-2 text-sm text-yellow-600">
									<Star className="h-4 w-4 mr-1 fill-current" />
									Relevance: {product.score.toFixed(2)}
								</div>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
