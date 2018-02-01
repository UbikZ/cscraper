import React, {Component} from 'react';

import {Footer, Header, Toastr} from './../../components';

export class App extends Component {
  render() {
    return (
      <div>
        <Header/>
        <Toastr/>
        <div>
          Test
        </div>
        <Footer/>
      </div>
    );
  }
}
