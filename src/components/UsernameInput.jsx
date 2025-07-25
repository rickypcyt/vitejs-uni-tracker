import React, { useState } from 'react';

import { supabase } from '@/utils/supabaseClient';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export default function UsernameInput({
  initialValue = '',
  userId,
  onUsernameChange,
  disabled = false,
  className = '',
}) {
  const [username, setUsername] = useState(initialValue);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateFormat = (value) => {
    if (!value) return 'Username is required';
    if (!USERNAME_REGEX.test(value)) return 'Only letters, numbers, and _ are allowed';
    if (value.length < 3) return 'Minimum 3 characters';
    if (value.length > 32) return 'Maximum 32 characters';
    return '';
  };

  const checkUnique = async (value) => {
    setChecking(true);
    setError('');
    setSuccess(false);
    // Consulta a Supabase para ver si existe otro usuario con ese username
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .neq('id', userId)
      .maybeSingle();
    setChecking(false);
    if (dbError) {
      setError('Error checking username');
      return false;
    }
    if (data) {
      setError('This username is already taken');
      return false;
    }
    setSuccess(true);
    return true;
  };

  const handleChange = async (e) => {
    const value = e.target.value;
    setUsername(value);
    setSuccess(false);
    setError('');
    onUsernameChange && onUsernameChange(value, false);
    const formatError = validateFormat(value);
    if (formatError) {
      setError(formatError);
      return;
    }
    await checkUnique(value).then((isUnique) => {
      if (isUnique) {
        onUsernameChange && onUsernameChange(value, true);
      } else {
        onUsernameChange && onUsernameChange(value, false);
      }
    });
  };

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-[var(--text-primary)]">Username</label>
      <input
        type="text"
        value={username}
        onChange={handleChange}
        disabled={disabled}
        className={`px-3 py-2 rounded-lg border-2 transition-colors bg-[var(--bg-secondary)] border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:bg-[var(--bg-secondary)] focus:outline-none ${
          error
            ? 'border-red-500'
            : success
            ? 'border-green-500'
            : ''
        }`}
        placeholder="Choose your unique username"
        minLength={3}
        maxLength={32}
        autoComplete="off"
      />
      {checking && <span className="text-xs text-gray-500">Checking...</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
      {success && <span className="text-xs text-green-600">Available!</span>}
    </div>
  );
} 