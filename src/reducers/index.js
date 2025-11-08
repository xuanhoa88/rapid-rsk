import { combineReducers } from 'redux';
import user from './user';
import runtime from './runtime';
import intl from './intl';

const rootReducer = combineReducers({
  user,
  runtime,
  intl,
});

export default rootReducer;
