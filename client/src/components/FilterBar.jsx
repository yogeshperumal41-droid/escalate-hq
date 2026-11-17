import React from 'react';
import { Search, Filter, RotateCcw, ShieldCheck, MapPin, Building2, Tag } from 'lucide-react';

const CITIES = ['All', 'Bengaluru', 'New Delhi', 'Mumbai', 'Hyderabad', 'Chennai', 'Pune'];
const CATEGORIES = ['All', 'Rude Staff', 'Overcharging', 'Poor Hygiene', 'Service Delay', 'Other'];
const STATUSES = ['All', 'Open', 'Escalated', 'Resolved'];

const FilterBar = ({
  filters,
  onChange,
  onReset,
  brands = [],
  totalCount = 0,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-8">
      {/* Top row: Search input & GPS Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search grievances, incidents, staff behavior, keywords..."
            value={filters.search || ''}
            onChange={(e) => onChange('search', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors"
          />
        </div>

        {/* GPS verified quick filter pill */}
        <button
          type="button"
          onClick={() => onChange('isGpsVerified', !filters.isGpsVerified)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
            filters.isGpsVerified
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
              : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${filters.isGpsVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>GPS-Verified Only</span>
        </button>
      </div>

      {/* Second row: Dropdown filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* City Filter */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-500" /> City
          </label>
          <select
            value={filters.city || 'All'}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 hover:border-slate-400 cursor-pointer shadow-xs"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Cities' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Filter */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-rose-500" /> Brand
          </label>
          <select
            value={filters.brandId || ''}
            onChange={(e) => onChange('brandId', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 hover:border-slate-400 cursor-pointer truncate shadow-xs"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-rose-500" /> Category
          </label>
          <select
            value={filters.category || 'All'}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 hover:border-slate-400 cursor-pointer shadow-xs"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-rose-500" /> Status
          </label>
          <select
            value={filters.status || 'All'}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 hover:border-slate-400 cursor-pointer shadow-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters summary & reset */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 text-xs text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{totalCount}</span> complaint{totalCount !== 1 ? 's' : ''}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors text-xs font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
