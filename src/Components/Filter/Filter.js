import React from 'react';
import './Filter.css'; 

const Filter = ({ filters, onFilterChange }) => {
    return (
        <div className="filter-container">
            <h3>Filters</h3>
            <div>
                <input
                    type="number"
                    placeholder="Min Price"
                    onChange={(e) => onFilterChange('minPrice', e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Max Price"
                    onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                />
            </div>
            <div>
                <select onChange={(e) => onFilterChange('category', e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="furniture">Furniture</option>
                    <option value="clothing">Clothing</option>
                </select>
            </div>
            <div>
                <input
                    type="number"
                    placeholder="Year of Purchase"
                    onChange={(e) => onFilterChange('year', e.target.value)}
                />
            </div>
        </div>
    );
};

export default Filter;