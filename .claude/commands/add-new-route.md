Add a new route to the React Starter Kit application following these steps:

## 1. Create Route Directory and Files

Create a new directory under `src/routes/` with the following structure:

```
src/routes/my-route/
├── index.js          # Route definition and data fetching
├── MyRoute.js        # React component
├── MyRoute.css       # CSS Modules styles
└── MyRoute.test.js   # Jest tests (optional)
```

## 2. Route Definition (index.js)

```javascript
import React from 'react';
import Layout from '../../components/Layout';
import MyRoute from './MyRoute';

export default {
  path: '/my-route',
  title: 'My Route Title',
  description: 'SEO description for this route',
  
  async action({ fetch, params, query }) {
    // Fetch data if needed
    const data = await fetch('/api/my-data');
    
    return {
      title: 'My Route Title',
      description: 'SEO description',
      component: (
        <Layout>
          <MyRoute data={data} />
        </Layout>
      ),
    };
  },
};
```

## 3. React Component (MyRoute.js)

```javascript
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '../../hooks/useAppContext';
import s from './MyRoute.css';

function MyRoute({ data }) {
  const { insertCss } = useAppContext();
  
  useEffect(() => {
    const removeCss = insertCss(s);
    return () => removeCss();
  }, [insertCss]);
  
  return (
    <div className={s.container}>
      <h1 className={s.title}>My Route</h1>
      <p>{data?.message}</p>
    </div>
  );
}

MyRoute.propTypes = {
  data: PropTypes.shape({
    message: PropTypes.string,
  }),
};

MyRoute.defaultProps = {
  data: null,
};

export default MyRoute;
```

## 4. CSS Modules (MyRoute.css)

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}
```

## 5. Register Route in Router

Add the route to `src/router.js`:

```javascript
import myRoute from './routes/my-route';

const routes = {
  path: '/',
  children: [
    // ... existing routes
    myRoute,
  ],
};
```

## 6. Add Navigation Link (Optional)

Update `src/components/Navigation/Navigation.js`:

```javascript
<Link className={s.link} to="/my-route">
  My Route
</Link>
```

## 7. Test the Route

```bash
npm start
# Navigate to http://localhost:3000/my-route
```

## Advanced Features

### Dynamic Routes with Parameters

```javascript
export default {
  path: '/users/:id',
  
  async action({ fetch, params }) {
    const user = await fetch(`/api/users/${params.id}`);
    
    return {
      title: `User: ${user.name}`,
      component: <UserProfile user={user} />,
    };
  },
};
```

### Protected Routes (Authentication)

```javascript
import { useSelector } from 'react-redux';

export default {
  path: '/dashboard',
  
  async action({ fetch, store }) {
    const { user } = store.getState();
    
    if (!user) {
      return { redirect: '/login' };
    }
    
    const data = await fetch('/api/dashboard');
    
    return {
      title: 'Dashboard',
      component: <Dashboard data={data} />,
    };
  },
};
```

### Code Splitting (Lazy Loading)

```javascript
export default {
  path: '/heavy-page',
  
  async action() {
    const HeavyPage = await import('./HeavyPage');
    
    return {
      title: 'Heavy Page',
      component: <HeavyPage.default />,
    };
  },
};
```

## Testing

Create `MyRoute.test.js`:

```javascript
import React from 'react';
import { render } from '@testing-library/react';
import MyRoute from './MyRoute';

describe('MyRoute', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<MyRoute />);
    expect(getByText('My Route')).toBeInTheDocument();
  });
});
```

Run tests:
```bash
npm test
```
