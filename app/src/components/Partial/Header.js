import React, {Component} from 'react';
import {Link} from 'react-router-dom';

export class Header extends Component {
  render() {
    return (
      <section>
        <nav>
          <section>
            <strong><Link to='/'>C-Scr4p3r</Link></strong>
            <Link to='/authentication'>Auth</Link>
          </section>
          <section>
            <a href="https://github.com/ubikz/cscraper" rel="noopener">Github</a>
          </section>
        </nav>
      </section>
    );
  }
}
