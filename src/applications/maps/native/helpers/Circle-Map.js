import RobinsonProjection from "./RobinsonProjection"

class CircleMap {

    constructor(svgElement) {

        this._svg = svgElement;
        // temporarily unhide all the circlesto get the bounding rects

        svgElement.classList.remove('hide-circles');

        let mapDimensions = this.getDimensions(); // also enforces a style update
        this._circleDiameter = 0;
        let circles = svgElement.querySelectorAll('circle');

        for (let i = 0; i < circles.length; ++i) {
            circles[i].cellId = i;
            let boundingBox = circles[i].getBoundingClientRect();
            // values relative to map width / height such that they work also when we resize the map
            circles[i].centerX = (boundingBox.left + boundingBox.width/2 - mapDimensions.left) / mapDimensions.width;
            circles[i].centerY = (boundingBox.top + boundingBox.height/2 - mapDimensions.top) / mapDimensions.height;
            // the circles differ very slightly in size, so we take the biggest
            this._circleDiameter = Math.max(this._circleDiameter, boundingBox.width / mapDimensions.width);
        }
        this._cells = circles;
        this._links = [];
        // after we got the circle bounding rects, we can hide them again
        svgElement.classList.add('hide-circles');
    }

    getDimensions() {
        return this._svg.getBoundingClientRect();
    }

    unhighlightCell(cell) {
        cell.setAttribute('class', '');
        cell.data = null;
    }

    highlightCell(cell, className, data) {
        cell.setAttribute('class', className);

        if (className === 'own-peer') {
            // put my own cell on top of everything else. In svg the stacking is not affected by z-index, but
            // only by document order. So we make the cell the last child
            cell.parentElement.appendChild(cell);
        }

        // XXX another hack
        if (data) {
            cell.data = data;
        }
    }

    _convertCoordinates(latitude, longitude) {
        let mapDimensions = this.getDimensions();
        // the map that we have is cropped out from the full robinson projected map. We have to make
        // the computation on the full/original map, so we calculate the full size.
        let fullMapWidth = 1.0946808510638297 * mapDimensions.width;
        let fullMapHeight = fullMapWidth / 1.97165551906973; // RobinsonProjection maps have a fixed aspect ratio
        let projection = new RobinsonProjection(fullMapWidth, fullMapHeight);
        let point = projection.project(latitude, longitude);
        // the origin is centered in the middle of the map, so we translate it
        // to the top left corner
        point.x = fullMapWidth/2 + point.x;
        point.y = fullMapHeight/2 - point.y;
        // the map that we have is robinson projected and then cropped out and scaled
        point.x = Math.max(0, point.x - 0.07045675413022352*fullMapWidth);
        point.y = Math.max(0, point.y - 0.012380952380952381*fullMapHeight);
        return point;
    }

    _testCoordinateConversion(latitude, longitude) {
        let testDot = window.testDot;
        if (!testDot) {
            testDot = document.createElement('div');
            testDot.style.background = 'red';
            testDot.style.width = '5px';
            testDot.style.height = '5px';
            testDot.style.position = 'absolute';
            document.body.appendChild(testDot);
            window.testDot = testDot;
        }
        let convertedCoordinates = this._convertCoordinates(latitude, longitude);
        console.log(convertedCoordinates);
        testDot.style.left = convertedCoordinates.x-2+'px';
        testDot.style.top = convertedCoordinates.y-2+'px';
    }

    _getClosestCell(x, y) {
        let mapDimensions = this.getDimensions();
        let bestDistance = 0;
        let bestCell = null;


        for (let i = 0; i < this._cells.length; ++i) {
            // Calculate position from bounding box.
            let cell = this._cells[i];
            let centerX = cell.centerX * mapDimensions.width;
            let centerY = cell.centerY * mapDimensions.height;
            let xDist = centerX - x;
            let yDist = centerY - y;
            let distance = xDist*xDist + yDist*yDist;

            // Update best cell accordingly.
            if (!bestCell || distance < bestDistance) {
                bestDistance = distance;
                bestCell = cell;
            }
        }


        // Return best cell only if its distance in terms of cells is not too far.
        let circleDiameter = this._circleDiameter * mapDimensions.width;
        return bestDistance > CircleMap.MAX_CELL_DISTANCE * circleDiameter ? null : bestCell;
    }

    getCellByLocation(latitude, longitude) {
        let convertedCoordinates = this._convertCoordinates(latitude, longitude);
        let closestCell = this._getClosestCell(convertedCoordinates.x, convertedCoordinates.y);
        return closestCell;
    }

    addLink(startCell, endCell) {

        if (!startCell || !endCell) {
            return;
        }

        // search whether we already drew that link
        for (let i=0, link; link = this._links[i]; ++i) {
            if (link.start === startCell && link.end === endCell
                || link.end === startCell && link.start === endCell) {
                return;
            }
        }

        // draw the link
        let svgBoundingRect = this.getDimensions();
        let viewBox = this._svg.viewBox;
        let viewBoxWidth = viewBox.baseVal.width;
        let viewBoxHeight = viewBox.baseVal.height;
        let pathEl = document.createElementNS(this._svg.namespaceURI, 'path');

        let path = 'M'+(startCell.centerX*viewBoxWidth)+' '+(startCell.centerY*viewBoxHeight)
            +'L'+(endCell.centerX*viewBoxWidth)+' '+(endCell.centerY*viewBoxHeight);

        pathEl.setAttributeNS(null,'d', path);
        pathEl.classList.add('link');

        this._links.push({
            start: startCell,
            end: endCell,
            path: pathEl
        });

        // insert the path before the startCell such that it will not be drawn over the startCell
        startCell.parentElement.append(pathEl);
        //startCell.parentElement.insertBefore(pathEl, startCell);
    }

    removeLink(startCell, endCell) {
        for (let i=0, link; link = this._links[i]; ++i) {
            if (link.start === startCell && link.end === endCell
                || link.end === startCell && link.start === endCell) {
                // we found the link
                startCell.parentElement.removeChild(link.path);
                this._links.splice(i, 1);
                return;
            }
        }
    }
}

CircleMap.MAX_CELL_DISTANCE = 12; // in terms of cells


export default CircleMap;