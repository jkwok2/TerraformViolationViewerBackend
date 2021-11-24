const testFunc = require("../testFunctionExamples/exampleFunction");

// Examples of how to use the basic mock functions with jest.

// This is an example of testing function without a mock.
// This is likely not going to be an option for functions that call AWS services.
it ('without mock', () => {
    expect(testFunc.testFuncMockExample(3,2,testFunc.subFunc)).toBe(1);
});

// The .mock property keeps track of a variety of data on the mock functions.

// In this example, I created a mock function called mockSubFunc with jest.
// The mock function is passed into testFuncMockExample instead of an actual function like the test above.
// The test then checks how many times the mock function which was passed into testFuncMockExample,
// and expects it to be 1
it ('mock function called once', () => {
    const mockSubFunc = jest.fn();
    testFunc.testFuncMockExample(3,2,mockSubFunc)
    expect(mockSubFunc.mock.calls.length).toBe(1);
});

// The number of calls is not tracked across different tests, so this test would fail
it ('fail mock function called twice, should fail', () => {
    const mockSubFunc = jest.fn();
    testFunc.testFuncMockExample(3,2,mockSubFunc);
    expect(mockSubFunc.mock.calls.length).toBe(2);
});

// In this example, the mock is called twice, once by each call of testFuncMockExample
it ('fail mock function called twice, should pass', () => {
    const mockSubFunc = jest.fn();
    testFunc.testFuncMockExample(3,2,mockSubFunc);
    testFunc.testFuncMockExample(5,1,mockSubFunc);
    expect(mockSubFunc.mock.calls.length).toBe(2);
});

// In this example, instead of checking how many times the mock function is called,
// we check the values that are passed to the mock function on each call.
it ('check value passed to mock function', () => {
    const mockSubFunc = jest.fn();
    testFunc.testFuncMockExample(3,2,mockSubFunc);
    testFunc.testFuncMockExample(5,1,mockSubFunc);
    // This is the call to get the parameters passed into the mock function.
    // The first index: which call of the function.
    // The second index: which parameter passed on that call.

    // These tests still pass.

    expect(mockSubFunc.mock.calls[0][0]).toBe(3);
    // The second parameter passed on the first call
    expect(mockSubFunc.mock.calls[0][1]).toBe(2);
    // The first parameter on the second call
    expect(mockSubFunc.mock.calls[1][0]).toBe(5);
    // The second parameter on the second call
    expect(mockSubFunc.mock.calls[1][1]).toBe(1);
});

// If you are not passing in functions, so you can't pass in the mock function,
// you can copy paste the code into the test, then mock a function and replace the function call in your code.
it ('mock function directly with pasted code', () => {
    const mockSubFunc = jest.fn();

    // If you do not pass the API function etc, into your code.
    // This is same as the function in exampleFunction, just without a parameter for a function.
    function directlyCopiedMockExample(a, b) {
        // I replaced the function call with the mock function.
        return mockSubFunc(a, b);
    }
    directlyCopiedMockExample(4,3);
    directlyCopiedMockExample(2,0);

    // These tests still pass.
    expect(mockSubFunc.mock.calls.length).toBe(2);
    expect(mockSubFunc.mock.calls[0][0]).toBe(4);
    expect(mockSubFunc.mock.calls[0][1]).toBe(3);
    expect(mockSubFunc.mock.calls[1][0]).toBe(2);
    expect(mockSubFunc.mock.calls[1][1]).toBe(0);
});
// This video might also help https://www.youtube.com/watch?v=IDjF6-s1hGk

// For more uses of mock functions https://jestjs.io/docs/mock-functions.
// There are also other documentation of Jest in general there.