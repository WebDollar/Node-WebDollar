class MapModal {

    constructor() {
        this._container = document.querySelector('.map-dialog-description');

        this._iconMyself = document.querySelector('.map-dialog-description .icon-myself');
        this._iconBrowser = document.querySelector('.map-dialog-description .icon-browser');
        this._iconTerminal = document.querySelector('.map-dialog-description .icon-terminal');

        this._text = document.querySelector('.map-dialog-description .map-dialog-description-text');
    }

    _hideAllIcons(exclude){
        if (exclude !== this._iconMyself)  this._iconMyself.style.display = 'none';
        if (exclude !== this._iconBrowser)  this._iconBrowser.style.display = 'none';
        if (exclude !== this._iconTerminal)  this._iconTerminal.style.display = 'none';
    }

    _setNodeType(nodeType) {

        let icon;

        if (nodeType === 'myself') icon = this._iconMyself;
        else if (nodeType === 'browser') icon = this._iconBrowser;
        else if (nodeType === 'terminal') icon = this._iconTerminal;
        else icon = this._iconTerminal;

        icon.style.display = 'inline-block';
        this._hideAllIcons(icon);

    }

    show(desc) {
        this._setNodeType(desc.nodeType);

        this._text.innerHTML = `<b>${desc.status} </b><br>${desc.country}, ${desc.city}<br><small>${desc.address || '&nbsp;'}</small>`;
        this._container.style.opacity = 1;
    }

    hide() {
        this._container.style.opacity = 0;
    }
}

export default MapModal