# Unit testing with Jest for Twilio Serverless environment

This repo is an example of how to perform automated test with Jest on your Twilio Serverless environment. The idea is to perform the test without having to spin a web server, making this the ideal way to test your functions in a automated environment (CI/CD). 

The base of the repo is a new serverless project created with: 

```
twilio serverless:init my-project
```
No template has been used to create this repo. More info can be found on the official [Twilio Serverless Toolkit documentation page](https://www.twilio.com/docs/labs/serverless-toolkit). 

Apart from the test assets (more on them later) a new function called `custom-response` has been added to show how to test `Twilio.Response` responses. 

# Simple Test 

The first example of a test, is in `test\hello-world.test.js`. This is used to test the default `hello-world.js` function. This function is supposed to return a TwiML document for a voice response. In the test file, we use Jest's `expect().toBe()` to check the content TwiML. 

## Token function 

First thing we define a `tokenFunction` which represents the function we want to test. This is included using: 
```javascript
const tokenFunction = require('../functions/hello-world').handler;
```
Note how we are importing the `handler()` function here (the one that is normally executed by the serverless environment when the endpoint is called). The next operation is to acutally execute this function in our test environment passing the right arguments. 
```javascript
tokenFunction(context, {}, callback);
```
Let's dive into the two arguments. 

## Defining a _context_ for testing static methods

In the Twilio Serverless environment, the `context` variables holds runtime context specific information, such as environment variables (e.g. usually defined in `.env` file) and the Twilio Client (accessible through `context.getTwilioClient()`). In our test environment, the `context` needs to be passed as the first argument of the call, so we need to build it from scratch. 

The first items to add are environment variables as well as authentication information (i.e. Account SID and auth token). The Twilio Serverless Toolkit automatically generate a `.env` file that contains API keys and API secret (instead of ACCOUNT SID and AUTH TOKEN). This is a design choice, and will have consequences on how we perform some of the test (more on that later). Since for this test we are only going to use Twilio's client static method, we don't actually need to authenticate the client. So the `context` variable is empty. 

Later on we are going to see another example where we add information to the context. 

## Defining a callback

The callback is the actual function that will check the results passed by the function we want to test. When the serverless environment is deployed, the callback function is executed by the serverless environment to return a response to the browser / api client. For our test we are just going to inspect the argument of the callback function and make sure it's what we expect: 
```javascript
    const callback = (err, twimlResponse) => {
      expect(twimlResponse.toString()).toBe(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Hello World!</Say></Response>'
      );
      done();
    };
```
At the end of the function we are going to call `done()` to let Jest know that we are done with our test and the result can be displayed. As a test, change the expected XML above and see how the Jest framework returns an error. 

# Test a response that returns a `Twilio.Response` object 

In many instances, you may want to customize the response sent to the browser / api client, for example changing the headers. In a Twilio Serverless environment, you would do that using the `Twilio.Response` object (more info [here](https://www.twilio.com/docs/runtime/functions/invocation#constructing-a-response)). For example if you want your function to return a `HTTP 204` you would use: 
```javascript
exports.handler = function(context, event, callback) {
	let response = new Twilio.Response();	
	// Set the status code to 204 Not Content
	response.setStatusCode(204);
	callback(null, response);
}
```

## Mocking Twilio.Response()

The problem with testing this code, is that the `Twilio.Response()` is not available in the local Twilio Environment (e.g. `twilio-run`). But we can extend what's available, by mocking the response methods. We do that in the file `test/helpers/twilio-runtime.js`. In this file we extend the global Twilio object, adding a `Response()`: 
```javascript
  global.Twilio.Response = Response;
```
We also initalize a new authenticated client, and we add a `getTwilioClient()` to the `context` variable: 
```javascript
context.getTwilioClient = () => new Twilio(context.API_KEY, context.API_SECRET, {accountSid: context.TWILIO_ACCOUNT_SID});
```
We then wrap all of that into the functions `setup(context)`. This function will be called from Jest to initialize the test environment before executing the test.

## Testing response

The test is implemented in the file `test/custom-response.js`. In this case we intialize the `context` with the authentication imformation. Note that (as stated above) by default the serverless toolkit uses API Key and API secret. More info about this design decision can be found [here](https://github.com/twilio-labs/twilio-run/issues/34). This requires a _workaround_ in order to use it locally: you need to add the `TWILIO_SID` variable to `.env` file to specify which account SID the API key belongs to. Alternatively you can replace `ACCOUNT_SID` and `AUTH_TOKEN` with _real_ account sid and auth token (not advised). 

Once defined the `context` variable, we need to load the helpers. We do that in: 

```javascript
  beforeAll(() => {
    jest.setTimeout(10000);
    helpers.setup(context);
  });
```

We also set the timeout for Jest to 10 second, to match [the one used in the Twilio environment](https://www.twilio.com/changelog/twilio-functions-increased-timeout) 

In addition to that, we _clean-up_ the test environment once the test is executed: 

```javascript
  afterAll(() => {
    helpers.teardown();
  });
```

With `teardown()` being one of the helper functions defined in `test/helpers/twilio-runtime.js`. 

The test is then executed similarly to the simple test above. We have a callback function which test the return object from your function. In particular this is testing a response header and the body: 

```javascript
      try {
        expect(response._headers['Content-Type']).toBe('application/json');
        expect(response._body['success']).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
```
Note how we are using a `try catch` syntax here, as required by the Jest Async testing [documentation](https://jestjs.io/docs/en/asynchronous)

# Execute the sample test 

Once you've checked out the repo, use the following command to install dependencies: 
```
npm install
```
Then edit the `.env` file adding the following info: 

* `ACCOUNT_SID`: This is *NOT* your account SID but an API KEY (SKXXXXXXXXXXXXXXXXXXXXXXXX) that can be generated [here](https://www.twilio.com/console/sms/project/api-keys)
* `AUTH_TOKEN`: This is the API secret generated with the key (see above bullet)
* `TWILIO_SID`: this is the account SID of the Twilio Account you used to initialize your serverless environment
* `OUTBOUND_PHONE_NUMBER`: this is the number Twilio used to send an SMS in the `custom-reponse.js` test
* `DESTINATION_PHONE_NUMBER`: this is the number Twilio will send an SMS to in the `custom-reponse.js` test

Once saved, just run: 

```
npm test
```

You should see something like the following: 

![test screenshot](./screenshot-test.png)

# Important information about testing Twilio client with Jest 

By default Jest execute all the network calls using `jsdom`. This creates an issue because Twilio client needs to change user-agent, and that triggers the following error:  

```
    console.error
      Error: Headers User-Agent forbidden
          at dispatchError (/Users/twilio/dev/twilio-unit-testing-serverless/node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:62:19)
          at validCORSPreflightHeaders (/Users/twilio/dev/twilio-unit-testing-serverless/node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:99:5)
          at Request.<anonymous> (/Users/twilio/dev/twilio-unit-testing-serverless/node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:367:12)
          at Request.emit (events.js:311:20)
          at Request.onRequestResponse (/Users/twilio/dev/twilio-unit-testing-serverless/node_modules/request/request.js:1059:10)
          at ClientRequest.emit (events.js:311:20)
          at HTTPParser.parserOnIncomingClient [as onIncoming] (_http_client.js:603:27)
          at HTTPParser.parserOnHeadersComplete (_http_common.js:119:17)
          at TLSSocket.socketOnData (_http_client.js:476:22)
          at TLSSocket.emit (events.js:311:20) undefined

      at VirtualConsole.<anonymous> (node_modules/jsdom/lib/jsdom/virtual-console.js:29:45)
      at dispatchError (node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:65:53)
      at validCORSPreflightHeaders (node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:99:5)
      at Request.<anonymous> (node_modules/jsdom/lib/jsdom/living/xhr/xhr-utils.js:367:12)
      at Request.onRequestResponse (node_modules/request/request.js:1059:10)
```
To avoid this issue (and to considerably speed up your test execution), we need to tell Jest that we are using node for testing. In order to do that, make sure the `package.json` contains (don't worry, this repo contains already this change): 

```json
...
  "jest": {
    "testEnvironment": "node"
  }
...
```
