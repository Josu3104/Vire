import React, { useState, useEffect, useRef } from 'react';
import styles from './FormInputs.module.css';
import { searchUsers } from '@/features/users/api/users.api';

export const TagInput = ({ value, onChange, placeholder, label }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className={styles.tagContainer}>
        {value.map(tag => (
          <span key={tag} className={styles.tagChip}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className={styles.removeBtn}>×</button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className={styles.tagInputFree}
        />
      </div>
    </div>
  );
};

export const UserSearchInput = ({ selectedUsers, onChange, label }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchUsers(query);
        setResults(response || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const addUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      onChange([...selectedUsers, user]);
    }
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const removeUser = (userId) => {
    onChange(selectedUsers.filter(u => u.id !== userId));
  };

  return (
    <div className="form-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <div className={styles.tagContainer}>
        {selectedUsers.map(user => (
          <span key={user.id} className={styles.userChip}>
            <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className={styles.userAvatar} />
            {user.name}
            <button type="button" onClick={() => removeUser(user.id)} className={styles.removeBtn}>×</button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => { if (query.trim().length >= 2) setShowDropdown(true); }}
          placeholder={selectedUsers.length === 0 ? "Buscar co-autor por nombre o correo..." : ""}
          className={styles.tagInputFree}
        />
      </div>

      {showDropdown && (query.trim().length >= 2) && (
        <div className={styles.dropdownMenu}>
          {isSearching ? (
            <div className={styles.dropdownItemEmpty}>Buscando...</div>
          ) : results.length > 0 ? (
            results.map(user => (
              <div key={user.id} className={styles.dropdownItem} onClick={() => addUser(user)}>
                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className={styles.dropdownAvatar} />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userMeta}>{user.profile?.university || 'Independiente'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.dropdownItemEmpty}>No se encontraron usuarios</div>
          )}
        </div>
      )}
    </div>
  );
};
