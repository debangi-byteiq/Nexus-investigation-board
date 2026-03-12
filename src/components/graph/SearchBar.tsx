import React, { useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const SearchBar: React.FC<Props> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="search-bar" role="search">
      <div className="search-input-wrap">
        <svg className="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          placeholder="Search entities…"
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label="Search graph entities"
        />
        {value && (
          <button
            className="search-clear-btn"
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
