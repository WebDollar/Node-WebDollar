class MapModal {

    constructor() {
        this._container = document.querySelector('.map-dialog-description');
        this._iconBrowser = document.querySelector('.map-dialog-description .browser');
        this._iconTerminal = document.querySelector('.map-dialog-description .terminal');
        this._text = document.querySelector('.map-dialog-description .map-dialog-description-text');
    }

    _setNodeType(isBrowser) {
        if (isBrowser) {
            this._iconBrowser.style.display = 'inline-block';
            this._iconTerminal.style.display = 'none';
        } else {
            this._iconBrowser.style.display = 'none';
            this._iconTerminal.style.display = 'inline-block';
        }
    }

    show(desc) {
        const isBrowser = true;
        this._setNodeType(isBrowser);
        const nodeType = isBrowser ? 'Browser' : 'Terminal';
        this._text.innerHTML = `<b>${desc.status} ${nodeType}</b><br>${desc.country} ${desc.city}<br><small>${desc.addr || '&nbsp;'}</small>`;
        this._container.style.opacity = 1;
    }

    hide() {
        this._container.style.opacity = 0;
    }
}

export default MapModal