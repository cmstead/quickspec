Quickspec
=========

Quickspec is a library for simplifying the process of testing pure functions and compositions of pure functions.  Rather than writing test after test to simply describe different cases, write a single test describing all cases at once as a scenario.

Quickspec is a library which can be integrated into your existing tests and is testing framework agnostic.  It is designed to work in both client- and server-side environments so it goes with you where you want to be.  Dump the boilerplate and start writing comprehensive tests quickly.

## Installing Quickspec ##

To install Quickspec, just run the following command:

`npm install quickspec --save-dev`

That's it!  You're ready to start using quickspec in your tests.

## Setting up Quickspec ##

To use Quickspec in node, do the following setup:

```
const quickspec = require('quickspec`)({ verbose: false });
```

If you are using quickspec in client-side tests, the setup is almost the same:

```
const quickspec = quickspecFactory({ verbose: false });
```

Be sure, if you are using a test runner like Karma, you include the client-safe quickspec file in your list of files:

`<project-root>/node_modules/quickspec/dist/quickspec.js`

## Writing tests with Quickspec ##

Writing tests with Quickspec requires changing the way you think about tests just a little.  Let's dig in:

Let's say we want to test a multiply function which takes two numbers and returns their product.  Here's what it could look like:

`const multiply = a => b => a * b;`

### Writing a test function ###

The first thing we will want to do is create a test function.  It will need to take a setup values object and a verify function:

```
const testMultiply = ({ a, b }, verify) => verify(multiply(a)(b));
```

Although this function is using object destructuring and arrow functions, you can do this with ES 5.1 code as well:

```
function testMultiply(setupValues, verify) {
    var a = setupValues.a;
    var b = setupValues.b;

    verify(multiplu(a)(b));
}
```

### Writing a test spec ###

In this walkthrough I will use Mocha, but this will work with any test framework.  Let's take a look at building and testing a spec:

```
it('should multiply values correctly according to our spec', function () {
    const specSet = [
        {
            name: 'Multiplying a a number by 0',
            setupValues: { a: 0, b: 5 },
            expectedValue: 0
        },
        {
            name: 'Multiplying a number by 1',
            setupValues: { a: 1, b: 7 },
            expectedValue: 7
        },
        {
            name: 'Multiplying a two numbers',
            setupValues: { a: 0.5, b: 9 },
            expectedValue: 4.5
        },
        {
            name: 'Multiplying a positive and negative number',
            setupValues: { a: -2, b: 11 },
            expectedValue: -22
        }
    ];

    const testMultiply = ({ a, b }, verify) => verify(multiply(a)(b));

    quickspec
        .verify(testMultiply)
        .over(specSet);
});
```

### Testing a spec with a theorem ###

A theorem is a claim that can be proven to be true.  Let's have a look at what this means to our test.

Note there is no expected value.  The theorem we provide will give us the correct value to compare to.

```
it('should multiply values correctly according to our spec', function () {
    const specSet = [
        {
            name: 'Multiplying a a number by 0',
            setupValues: { a: 0, b: 5 }
        },
        {
            name: 'Multiplying a number by 1',
            setupValues: { a: 1, b: 7 }
        },
        {
            name: 'Multiplying a two numbers',
            setupValues: { a: 0.5, b: 9 }
        },
        {
            name: 'Multiplying a positive and negative number',
            setupValues: { a: -2, b: 11 }
        }
    ];

    const multiplyTheorem = ({ a, b }) => return a * b;
    const testMultiply = ({ a, b }, verify) => verify(multiply(a)(b));

    quickspec
        .verify(testMultiply)
        .withTheorem(multiplyTheorem)
        .over(specSet);
});
```