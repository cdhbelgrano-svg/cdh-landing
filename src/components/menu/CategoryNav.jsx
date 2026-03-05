import React from 'react';

function CategoryNav({ categories, activeCategoryId, setActiveCategoryId }) {
    if (!categories || categories.length === 0) return null;

    return (
        <div className="overflow-x-auto custom-scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
            <div className="flex gap-2 min-w-max pb-1">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`px-4 py-1.5 rounded-full font-bold text-[13px] transition-all whitespace-nowrap shadow-sm ${activeCategoryId === cat.id
                            ? 'bg-cdh-orange text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent hover:border-white/10'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default CategoryNav;
