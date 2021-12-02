//These are the examples functions used in the example tests tests.

function testAddFunc(a, b) {
    return a+b;
}

function testSubFunc(a,b) {
    return a-b;
}

function testFuncMockExample(a, b, func) {
    return func(a, b);
}

module.exports.addFunc = testAddFunc;
module.exports.subFunc = testSubFunc;
module.exports.testFuncMockExample = testFuncMockExample;