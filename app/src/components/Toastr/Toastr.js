// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import style from './Toastr.scss';

const mapStateToProps = function (state) {
  const {notifs} = state.toastr;
  return {notifs};
};

type Props = {
  notifs: Array<{
    title?: string,
    message: string,
  }>,
};

@connect(mapStateToProps)
export class Toastr extends Component<Props> {
  render() {
    const {notifs} = this.props;

    return (
      <div className={style["toastr-block"]}>
        {notifs.map(notif => (
          <div key={notif.id} className={style["toastr-item"]}>
            {notif.title && (<p><strong>{notif.title}</strong></p>)}
            {notif.message}
          </div>
        ))}
      </div>
    );
  }
}
