const Twilio = require('twilio');

class Response {
  constructor() {
    this._body = {};
    this._headers = {};
    this._statusCode = 200;
  }

  setBody(body) {
    this._body = body;
  }

  setStatusCode(code) {
    this._statusCode = code;
  }

  appendHeader(key, value) {
    this._headers[key] = value;
  }
}

const setup = (context = {}) => {
  global.Twilio = Twilio;

  // Add here the code to extend Twilio Response
  global.Twilio.Response = Response;

  // Create the new istance of Twilio Client based on ACCOUNT_SID and AUTH_TOKEN
  if (context.API_KEY && context.API_SECRET && context.TWILIO_ACCOUNT_SID) {
    // global.twilioClient = new Twilio(context.API_KEY, context.API_SECRET, {accountSid: context.TWILIO_ACCOUNT_SID});
    context.getTwilioClient = () => new Twilio(context.API_KEY, context.API_SECRET, {accountSid: context.TWILIO_ACCOUNT_SID});
  }
};

const teardown = () => {
  delete global.Twilio;
};

module.exports = {
  setup: setup,
  teardown: teardown,
};
