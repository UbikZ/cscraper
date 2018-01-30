import React from 'react';
import {render} from 'react-dom';
import './app.scss'

const markup = (
  <div>
    Hello from react test
  </div>
);

render(markup, document.getElementById('app'));

if (module.hot) {
  module.hot.accept('./app.js', function () {
    console.log('Accepting the updated printMe module!');
  })
}
