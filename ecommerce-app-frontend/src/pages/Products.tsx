import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Grid, List } from 'lucide-react';
import { useQuery } from 'react-query';
import { productsAPI } from '../services/api';
import { Product, ProductFilters } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
  });

  const { addToCart } = useCartStore();

  // Update filters from URL params
  useEffect(() => {
    const newFilters: ProductFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: 12,
    };

    if (searchParams.get('search')) {
      newFilters.search = searchParams.get('search') || undefined;
    }
    if (searchParams.get('category')) {
      newFilters.category = searchParams.get('category') || undefined;
    }
    if (searchParams.get('minPrice')) {
      newFilters.minPrice = parseFloat(searchParams.get('minPrice') || '0');
    }
    if (searchParams.get('maxPrice')) {
      newFilters.maxPrice = parseFloat(searchParams.get('maxPrice') || '0');
    }

    setFilters(newFilters);
  }, [searchParams]);

  const { data, isLoading, error } = useQuery(
    ['products', filters],
    () => productsAPI.getProducts(filters),
    {
      keepPreviousData: true,
    }
  );

  const { data: categoriesData } = useQuery(
    'categories',
    () => productsAPI.getCategories(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    
    if (search.trim()) {
      setSearchParams({ search: search.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSearchParams({ category });
  };

  const handlePriceFilter = (minPrice?: number, maxPrice?: number) => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) params.set('minPrice', minPrice.toString());
    else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice.toString());
    else params.delete('maxPrice');
    setSearchParams(params);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: page.toString() });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading products</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-md">
              <Input
                name="search"
                type="text"
                placeholder="Search products..."
                defaultValue={filters.search}
                className="pr-10"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <Button
              variant={!filters.category ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({})}
            >
              All
            </Button>
            
            {categoriesData?.data.categories.map((category) => (
              <Button
                key={category}
                variant={filters.category === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Price
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        handlePriceFilter(value, filters.maxPrice);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Price
                    </label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={filters.maxPrice || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        handlePriceFilter(filters.minPrice, value);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* View Controls */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-600">
                {data?.data.pagination.total || 0} products found
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Products */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {data?.data.products.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                    <Link to={`/products/${product.id}`}>
                      <div className="aspect-w-16 aspect-h-12 overflow-hidden rounded-t-lg">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Link to={`/products/${product.id}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary-600">
                          ${product.price.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                        >
                          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                      </div>
                      {product.stock < 10 && product.stock > 0 && (
                        <p className="text-xs text-orange-600 mt-2">
                          Only {product.stock} left in stock!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data?.data.pagination && data.data.pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  {Array.from({ length: data.data.pagination.pages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === filters.page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
