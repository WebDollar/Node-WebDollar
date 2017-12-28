
class RobinsonProjection {
    constructor(width) {
        this._width = width;
        this._r = this._width / 5.332539516;
    }

    static _project(lat, lng)
    {
        // 5 degree intervals, so find right indices
        let lI = Math.floor((Math.abs(lat)-RobinsonProjection.EPS)/RobinsonProjection.INTERVAL);
        lI = Math.max(lI, 0);
        let hI = lI + 1;
        let ratio = (Math.abs(lat)-lI*RobinsonProjection.INTERVAL) / RobinsonProjection.INTERVAL;

        // interpolate x and y
        let xDist = RobinsonProjection.X[hI]-RobinsonProjection.X[lI];
        let yDist = RobinsonProjection.Y[hI]-RobinsonProjection.Y[lI];
        let x = ((xDist*ratio)+RobinsonProjection.X[lI]) * (Math.abs(lng) * RobinsonProjection.radians);
        x = lng < 0 ? -x : x;
        let y = (yDist*ratio)+RobinsonProjection.Y[lI];
        y = lat < 0 ? -y : y;

        return {
            x : x,
            y : y
        };
    }

    project(lat, lng) {
        let p = RobinsonProjection._project(lat, lng);
        return {
            x: p.x * this._r,
            y: p.y * this._r
        };
    }
}
RobinsonProjection.X = [
    0.8487, 0.84751182, 0.84479598, 0.840213,
    0.83359314, 0.8257851, 0.814752, 0.80006949,
    0.78216192, 0.76060494, 0.73658673, 0.7086645,
    0.67777182, 0.64475739, 0.60987582, 0.57134484,
    0.52729731, 0.48562614, 0.45167814
];

RobinsonProjection.Y = [
    0, 0.0838426, 0.1676852, 0.2515278, 0.3353704,
    0.419213, 0.5030556, 0.5868982, 0.67182264,
    0.75336633, 0.83518048, 0.91537187, 0.99339958,
    1.06872269, 1.14066505, 1.20841528, 1.27035062,
    1.31998003, 1.3523
];

RobinsonProjection.EPS = 1e-8;
RobinsonProjection.INTERVAL = 5;
RobinsonProjection.pi = Math.PI;
RobinsonProjection.radians = RobinsonProjection.pi / 180;
RobinsonProjection.degrees = 180 / RobinsonProjection.pi;

export default RobinsonProjection;