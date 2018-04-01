import React, {Component} from 'react';
import {Link} from 'react-router-dom';

export class Header extends Component {
  render() {
    return (
      <header className="navbar">
        <section className="navbar-section">
        </section>
        <section className="navbar-center">
        </section>
        <section className="navbar-section">
          <a href="https://github.com/ubikz/cscraper" className="btn btn-link">Github</a>
        </section>
      </header>
    );
  }
}
