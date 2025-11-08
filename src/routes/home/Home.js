/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import s from './Home.css';

/**
 * Format relative time using native Intl.RelativeTimeFormat
 * @param {Date|number} date - Date to format
 * @returns {string} Formatted relative time string
 */
function formatRelativeTime(date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;

  const units = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds: unitSeconds } of units) {
    if (Math.abs(seconds) >= unitSeconds) {
      const value = Math.round(seconds / unitSeconds);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
}

function Home({ data }) {
  const { loading, payload } = data;

  return (
    <div className={s.root}>
      <div className={s.container}>
        <h1>News</h1>
        {loading
          ? 'Loading...'
          : payload.map(item => (
              <article key={item.link} className={s.newsItem}>
                <h1 className={s.newsTitle}>
                  <a href={item.link}>{item.title}</a>
                </h1>{' '}
                <span className={s.publishedDate}>
                  {formatRelativeTime(item.pubDate)}
                </span>
                <div
                  className={s.newsDesc}
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </article>
            ))}
      </div>
    </div>
  );
}

Home.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    payload: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired,
        content: PropTypes.string,
        pubDate: PropTypes.string,
      }),
    ),
  }).isRequired,
};

export default Home;
