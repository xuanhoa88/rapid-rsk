/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import s from './Home.css';

function Home({ loading, payload }) {
  return (
    <div className={s.root}>
      {/* Features Section */}
      <section className={s.features}>
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>Why Choose React Starter Kit?</h2>
            <p className={s.sectionSubtitle}>
              Everything you need to build modern, scalable web applications
            </p>
          </div>
          <div className={s.featureGrid}>
            <div className={s.featureCard}>
              <div className={s.featureHeader}>
                <div className={s.featureIcon}>⚡</div>
                <h3 className={s.featureTitle}>Lightning Fast</h3>
              </div>
              <p className={s.featureDesc}>
                Server-side rendering with React 16+, automatic code splitting,
                and optimized Webpack 5 configuration for instant page loads and
                superior performance. Supports React 16, 17, and 18+
              </p>
            </div>
            <div className={s.featureCard}>
              <div className={s.featureHeader}>
                <div className={s.featureIcon}>🎨</div>
                <h3 className={s.featureTitle}>Beautiful Design System</h3>
              </div>
              <p className={s.featureDesc}>
                Professional UI with CSS Modules, design tokens, and responsive
                layouts. Mobile-first approach with accessibility built-in from
                day one
              </p>
            </div>
            <div className={s.featureCard}>
              <div className={s.featureHeader}>
                <div className={s.featureIcon}>🔧</div>
                <h3 className={s.featureTitle}>Developer Experience</h3>
              </div>
              <p className={s.featureDesc}>
                Hot Module Replacement for instant feedback, Redux DevTools for
                state debugging, and Jest + React Testing Library for
                comprehensive testing
              </p>
            </div>
            <div className={s.featureCard}>
              <div className={s.featureHeader}>
                <div className={s.featureIcon}>🌍</div>
                <h3 className={s.featureTitle}>Global Ready</h3>
              </div>
              <p className={s.featureDesc}>
                Full internationalization with react-i18next, locale-specific
                routing, and dynamic language switching. Currently supports
                English and Vietnamese
              </p>
            </div>
            <div className={s.featureCard}>
              <div className={s.featureHeader}>
                <div className={s.featureIcon}>🔐</div>
                <h3 className={s.featureTitle}>Secure by Default</h3>
              </div>
              <p className={s.featureDesc}>
                JWT authentication, protected routes, role-based access control,
                and security best practices implemented throughout the codebase
              </p>
            </div>
            <div className={s.featureCard}>
              <div className={s.featureHeader}>
                <div className={s.featureIcon}>🚀</div>
                <h3 className={s.featureTitle}>Production Ready</h3>
              </div>
              <p className={s.featureDesc}>
                Docker support, environment configuration, optimized builds, and
                comprehensive deployment guides. Ship to production with
                confidence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className={s.newsSection}>
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>Latest Updates</h2>
            <p className={s.sectionSubtitle}>
              Stay informed about new features, improvements, and announcements
            </p>
          </div>
          {loading ? (
            <div className={s.loading}>
              <div className={s.spinner}></div>
              <p>Loading latest updates...</p>
            </div>
          ) : (
            <div className={s.newsGrid}>
              {payload && payload.length > 0 ? (
                payload.map((item, index) => (
                  <article key={item.id || item.link} className={s.newsItem}>
                    <div className={s.newsContent}>
                      <div className={s.newsNumber}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className={s.newsBody}>
                        <h3 className={s.newsTitle}>
                          <a href={item.link}>{item.title}</a>
                        </h3>
                        <p className={s.newsDesc}>
                          {item.contentSnippet || item.content}
                        </p>
                        <a href={item.link} className={s.readMore}>
                          Learn more →
                        </a>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className={s.noNews}>
                  <p>No updates available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

Home.propTypes = {
  loading: PropTypes.bool.isRequired,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string.isRequired,
      link: PropTypes.string.isRequired,
      contentSnippet: PropTypes.string,
      content: PropTypes.string,
      pubDate: PropTypes.string,
    }),
  ),
};

export default Home;
