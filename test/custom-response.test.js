require('dotenv').config();
const helpers = require('./helpers/twilio-runtime');

// Note that by default when you create a new serverless environemnt
// using the twilio CLI, a new .env file is generated with ACCOUNT_SID
// and AUTH_TOKEN mapped to a new API_KEY and API_SECRET
// See https://github.com/twilio-labs/twilio-run/issues/34
var context = {
  API_KEY: process.env.ACCOUNT_SID,
  API_SECRET: process.env.AUTH_TOKEN,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_SID,
  OUTBOUND_PHONE_NUMBER: process.env.OUTBOUND_PHONE_NUMBER,
};

describe('Test sending SMS through runtime environment', () => {
  beforeAll(() => {
    jest.setTimeout(10000);
    helpers.setup(context);
  });
  afterAll(() => {
    helpers.teardown();
  });

  it('returns a custom Twilio.Response', (done) => {
    const tokenFunction = require('../functions/custom-response').handler;

    const callback = (err, response) => {
      try {
        expect(response._headers['Content-Type']).toBe('application/json');
        expect(response._body['success']).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    };

    tokenFunction(context, { to: '+447824336224' }, callback);
  });
});
