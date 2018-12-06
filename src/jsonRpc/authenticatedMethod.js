const authenticatedMethod = function (Method) {
    return function() {
        const oMethod = new Method(...arguments);
        oMethod.setOption('isPrivate', true);

        return oMethod;
    }
};

export default authenticatedMethod;
