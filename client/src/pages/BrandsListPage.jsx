import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Mail, PlusCircle } from 'lucide-react';
import { brandService } from '../services/api';

const CATEGORIES = [
  'All',
  'Petrol Pump / Fuel',
  'Banking & Finance',
  'Food & Dining',
  'Retail & Grocery',
  'Healthcare & Pharmacy',
  'Automobile & Service',
];

const BrandsListPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await brandService.getBrands({
        category: category !== 'All' ? category : undefined,
        search: search || undefined,
      });
      if (res.data.success) {
        setBrands(res.data.brands);
      }
    } catch (e) {
      console.error('Error fetching brands list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchBrands, 250);
    return () => clearTimeout(timer);
  }, [category, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Corporate Brand Scorecards
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Explore resolution rates, SLA compliance, and worst vs best franchise branches across India.
          </p>
        </div>

        <Link
          to="/report"
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-rose-200"
        >
          <PlusCircle className="w-4 h-4" />
          <span>File Complaint</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-8 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search brands (e.g. Indian Oil, Domino's, SBI, Shell)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-sm">
          No brands found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => {
            const resolutionRate =
              brand.totalComplaints > 0
                ? Math.round((brand.resolvedCount / brand.totalComplaints) * 100)
                : 100;

            return (
              <Link
                key={brand._id}
                to={`/brands/${brand.slug}`}
                className="group bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 group-hover:scale-105 transition-transform shadow-xs"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-rose-600">
                          {brand.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-600 transition-colors">
                          {brand.name}
                        </h3>
                        <span className="text-xs text-slate-500">{brand.category}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Resolution Gauge */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">Resolution Rate</span>
                      <span className="font-bold text-emerald-600 font-mono">{resolutionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${resolutionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">Total Cases:</span>
                      <strong className="text-slate-900">{brand.totalComplaints}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">Resolved:</span>
                      <strong className="text-emerald-700">{brand.resolvedCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[200px] flex items-center gap-1 font-mono">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {brand.escalationEmail}
                  </span>
                  <span className="font-semibold text-rose-600">Scorecard →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrandsListPage;
