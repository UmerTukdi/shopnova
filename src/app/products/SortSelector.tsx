'use client';

import React from 'react';

interface SortSelectorProps {
  sort: string;
  search?: string;
  category?: string;
  featured?: string;
  bestSeller?: string;
}

export default function SortSelector({ sort, search, category, featured, bestSeller }: SortSelectorProps) {
  return (
    <form method="GET" className="inline-block">
      {search && <input type="hidden" name="search" value={search} />}
      {category && <input type="hidden" name="category" value={category} />}
      {featured && <input type="hidden" name="featured" value={featured} />}
      {bestSeller && <input type="hidden" name="bestSeller" value={bestSeller} />}

      <select
        name="sort"
        defaultValue={sort}
        onChange={(e) => e.target.form?.submit()}
        className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </form>
  );
}
