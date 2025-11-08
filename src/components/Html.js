/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import serialize from 'serialize-javascript';

function Html({
  title,
  description,
  image = null,
  url = null,
  type = 'website',
  styles = [],
  scripts = [],
  app,
  children,
}) {
  return (
    <html className='no-js' lang={app.lang}>
      <head>
        <meta charSet='utf-8' />
        <meta httpEquiv='x-ua-compatible' content='ie=edge' />
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta name='viewport' content='width=device-width, initial-scale=1' />

        {/* Open Graph meta tags for social media sharing */}
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta property='og:type' content={type} />
        {url && <meta property='og:url' content={url} />}
        {image && <meta property='og:image' content={image} />}

        {/* Canonical URL for SEO */}
        {url && <link rel='canonical' href={url} />}
        {scripts.map(script => (
          <link key={script} rel='preload' href={script} as='script' />
        ))}
        <link rel='manifest' href='/site.webmanifest' />
        <link rel='apple-touch-icon' href='/icon.png' />
        {styles.map(style => (
          <style
            key={style.id}
            id={style.id}
            dangerouslySetInnerHTML={{ __html: style.cssText }}
          />
        ))}
      </head>
      <body>
        <div id='app' dangerouslySetInnerHTML={{ __html: children }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__APP_STATE__=${serialize(app)}`,
          }}
        />
        {scripts.map(script => (
          <script key={script} src={script} />
        ))}
      </body>
    </html>
  );
}

Html.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  styles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      cssText: PropTypes.string.isRequired,
    }).isRequired,
  ),
  scripts: PropTypes.arrayOf(PropTypes.string.isRequired),
  app: PropTypes.object.isRequired,
  children: PropTypes.string.isRequired,
};

export default Html;
