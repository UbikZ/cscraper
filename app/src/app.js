import React from 'react';
import thunk from 'redux-thunk';
import {render} from 'react-dom';
import {BrowserRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, compose, createStore} from 'redux';

import reducers from './reducers';
import {App} from './containers';

import './app.scss';

const composeEnhancers = (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(thunk)),
);

const markup = (
  <Provider store={store}>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </Provider>
);

render(markup, document.getElementById('app'));

if (module.hot) {
  module.hot.accept('./app.js', function () {
    console.log('Accepting the updated printMe module!');
  })
}
