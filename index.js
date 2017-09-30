(function (moduleFactory) {
    let isNode = typeof module !== undefined && typeof module.exports !== undefined

    if (isNode) {
        module.exports = moduleFactory();
    } else if (typeof signet === 'object') {
        window.quickspecFactory = moduleFactory();
    } else {
        throw new Error('The module quickspec requires Signet to run.');
    }

})(function () {
    'use strict';

    return function buildQuickspec(options) {

        const defaultOptions = {
            verbose: true
        };

        const optionsExist = typeof options === 'object' && options !== null;
        const testOptions = optionsExist ? options : defaultOptions;

        const verboseLogging = Boolean(testOptions.verbose);

        function getSpecName(specRecord) {
            return typeof specRecord.name === 'string' ? specRecord.name : 'unnamed';
        }

        function buildFailureMessage(specRecord, expectedResult, actualResult) {
            return 'Test \'' + getSpecName(specRecord) + '\' failure in spec: \n' +
                JSON.stringify(specRecord.setupValues, null, 4) + '\n\n' +
                'Expected result to be ' + expectedResult + ', but got ' + actualResult;
        }

        function logStatus(status, message) {
            if (verboseLogging) {
                console.log(`\t[quickspec:${status}] -- ${message}`);
            }
        }

        function compareObjects(expectedResult, actualResult) {
            let objectsOk = actualResult !== null 
                && typeof expectedResult === typeof actualResult;

            const expectedKeys = Object.keys(expectedResult);
            const actualKeys = Object.keys(actualResult);

            objectsOk = objectsOk && expectedKeys.length === actualKeys.length;

            return expectedKeys.reduce(function (result, key) {
                return objectsOk && compareResults(expectedResult[key], actualResult[key]);
            }, objectsOk);
        }

        function compareResults(expectedResult, actualResult) {
            return typeof expectedResult !== 'object' || expectedResult === null
                ? expectedResult === actualResult
                : compareObjects(expectedResult, actualResult);
        }

        function logResultStatus(specRecord, testResultOk) {
            const status = testResultOk ? 'success' : 'failure';
            const message = testResultOk
                ? `Finished running '${getSpecName(specRecord)}' successfully`
                : `Failed spec: ${getSpecName(specRecord)}`;

            logStatus(status, message);
        }

        function throwOnFailure(testResultOk, specRecord, expectedResult, actualResult) {
            if (!testResultOk) {
                throw new Error(buildFailureMessage(specRecord, expectedResult, actualResult));
            }
        }

        const throwOnFailureBuilder = (specRecord, theorem) => (actualResult) => {
            const expectedResult = theorem(specRecord.setupValues);
            const testResultOk = compareResults(expectedResult, actualResult);

            logResultStatus(specRecord, testResultOk);
            throwOnFailure(testResultOk, specRecord, expectedResult, actualResult);
        }

        const always = (value) => () => value;

        function runVerification(testRunner, specSet, theorem) {
            specSet.forEach(function (specRecord) {
                const localTheorem = typeof theorem === 'function' ? theorem : always(specRecord.expectedResult);
                const resolveTestResult = throwOnFailureBuilder(specRecord, localTheorem);

                testRunner(specRecord.setupValues, resolveTestResult);
            });
        }


        const verifyWithTheorem = (testRunner) => (theorem) => {
            return {
                over: (specSet) => runVerification(testRunner, specSet, theorem)                
            }
        }

        function verify(testRunner) {

            const nextActions = verifyWithTheorem(testRunner)(null);
            nextActions.withTheorem = verifyWithTheorem(testRunner);

            return nextActions;
        }

        return {
            verify: verify
        };
    }

});
