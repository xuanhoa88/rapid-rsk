/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import renderer from 'react-test-renderer';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import App from '../App';
import Layout from './index';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const initialState = {
  runtime: {
    availableLocales: ['en-US'],
  },
  intl: {
    locale: 'en-US',
  },
};

describe('Layout', () => {
  test('renders children correctly', () => {
    const store = mockStore(initialState);

    const wrapper = renderer
      .create(
        <App
          insertCss={() => {}}
          context={{
            fetch: () => {},
            pathname: '',
            store,
          }}
        >
          <Layout>
            <div className='child' />
          </Layout>
        </App>,
      )
      .toJSON();

    expect(wrapper).toMatchSnapshot();
  });
});
