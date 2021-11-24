const testFunc = require("../testFunctionExamples/exampleFunction");

//Basic syntax for testing with jest, should be pretty familiar.

it('jest test function 1 works', () => {
    expect(testFunc.addFunc(1,2)).toBe(3)
});

it('jest test function 2 works', () => {
    expect(testFunc.subFunc(5,2)).toBe(3)
});