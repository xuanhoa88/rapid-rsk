/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { Router } from 'express';
import authRouter from './auth';
import newsRouter from './news';

const router = Router();

// Mount auth routes at /api/auth
router.use('/auth', authRouter);

// Mount news routes at /api/news
router.use('/news', newsRouter);

// Add more API routes here as needed
// Example:
// import userRouter from './user';
// router.use('/users', userRouter);  // Will be accessible at /api/users

export default router;
