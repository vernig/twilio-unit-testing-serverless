require('dotenv').config();
const helpers = require('./helpers/twilio-runtime');

const context = {
  // For TwiML test we just use Twilio static methods
  // so we don't need to create a new client and authenitcate.
  // Se we can keep context empty
};

describe('Test voice response TwiML', () => {
  beforeAll(() => {
    helpers.setup(context);
  });
  afterAll(() => {
    helpers.teardown();
  });

  it('returns "Hello World" TwiML response', (done) => {
    const tokenFunction = require('../functions/hello-world').handler;

    const callback = (err, twimlResponse) => {
      expect(twimlResponse.toString()).toBe(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Hello World!</Say></Response>'
      );
      done();
    };

    tokenFunction(context, {}, callback);
  });
});
