/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import { useState } from 'react';
import s from './ResetPassword.css';

function ResetPassword({ title, fetch }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.root}>
      <div className={s.container}>
        <h1>{title}</h1>

        {error && (
          <div className={s.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className={s.success}>
            <strong>Success!</strong> If an account exists with that email, you
            will receive a password reset link shortly.
          </div>
        )}

        <form method='post' onSubmit={handleSubmit}>
          <div className={s.formGroup}>
            <label className={s.label} htmlFor='email'>
              Email address:
              <input
                className={s.input}
                id='email'
                type='email'
                name='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus // eslint-disable-line jsx-a11y/no-autofocus
              />
            </label>
          </div>
          <div className={s.formGroup}>
            <button className={s.button} type='submit' disabled={loading}>
              {loading ? 'Please wait...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
        <div className={s.formGroup}>
          <a href='/login' className={s.buttonLink}>
            Back to Log In
          </a>
        </div>
      </div>
    </div>
  );
}

ResetPassword.propTypes = {
  title: PropTypes.string.isRequired,
  fetch: PropTypes.func.isRequired,
};

export default ResetPassword;
