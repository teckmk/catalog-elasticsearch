import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { SearchBar } from './components/SearchBar';
import { ProductList } from './components/ProductList';
import { Pagination } from './components/Pagination';
import { Database } from 'lucide-react';
import axios from 'axios';

// Get the base URL from the current environment
const baseURL = import.meta.env.PROD ? '' : 'http://localhost:3000';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasMore: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${baseURL}/api/search`, {
        params: {
          query: searchQuery,
          page,
          limit: 12
        }
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setIsLoading(false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchProducts(1);
  };

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const handleCatalogLoad = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${baseURL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsLoaded(true);
      fetchProducts(1);
    } catch (error) {
      console.error('Error uploading catalog:', error);
      alert('Error uploading catalog');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Catalog Search
          </h1>
          <p className="text-lg text-gray-600">
            Upload your catalog and search through your products instantly
          </p>
        </div>

        {!isLoaded ? (
          <div className="flex justify-center">
            <FileUpload onCatalogLoad={handleCatalogLoad} />
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-8">
            <div className="w-full flex justify-center">
              <SearchBar 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <ProductList products={products} />
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;