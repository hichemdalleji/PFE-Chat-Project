import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { immutableRenderDecorator } from 'react-immutable-render-mixin';

import Dialog from '@/components/Dialog';

@immutableRenderDecorator
export default class AppDownload extends Component {
    static propTypes = {
        visible: PropTypes.bool.isRequired,
        onClose: PropTypes.func.isRequired,
    }
    render() {
        const { visible, onClose } = this.props;
        return (
            <Dialog className="dialog app-download" visible={visible} title="" onClose={onClose}>
               
            </Dialog>
        );
    }
}
