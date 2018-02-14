class DetectMultipleWindows {

    constructor() {

        if (typeof window === "undefined")
            return;

        window.addEventListener('storage', (data) => {
            if (data.key === this.HI1)
                this._hi2(e.newValue);
        });
        window.addEventListener('unload', () => {
            this._hi3();
        });

    }

    isWindowSingle() {

        return new Promise((resolve) => {

            const nonce = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

            const timeout = setTimeout( () => {
                window.removeEventListener('storage', listener);
                resolve(true);
            }, 500);

            const listener = (e) => {

                if (e.key === this.HI2 && e.newValue == nonce) {
                    clearTimeout(timeout);

                    window.removeEventListener('storage', listener);
                    resolve(false);
                }

            };
            window.addEventListener('storage', listener);

            this._hi1(nonce);
        });
    }

    waitForSingleTabNow(waitCallback, ) {

        return new Promise((resolver)=>{

            setTimeout( async ()=>{ await this._waitForSingleTab(waitCallback, resolver)}, 100);

        });
    }

    async _waitForSingleTab(waitCallback, promiseResolver){

        let windowSingle = await this.isWindowSingle();

        if (windowSingle)
            promiseResolver ( true );
        else {

            if (typeof waitCallback === "function")
                waitCallback();

            const listener = (e) => {
                if (e.key === this.HI3) {
                    window.removeEventListener('storage', listener);
                    // Don't pass fnWait, we only want it to be called once.
                    this._waitForSingleTab(undefined, promiseResolver);
                }
            };
            window.addEventListener('storage', listener);
        }
    }


    get HI1() {
        return 'Windows.HI1';
    }

    get HI2() {
        return 'Windows.HI2';
    }

    get HI3() {
        return 'Windows.HI3';
    }

    _hi1(nonce) {
        localStorage.setItem(this.HI1, nonce);
    }

    _hi2(nonce) {
        localStorage.setItem(this.HI2, nonce);
    }

    _hi3() {
        localStorage.setItem(this.HI3, Date.now());
    }
}

export default new DetectMultipleWindows();