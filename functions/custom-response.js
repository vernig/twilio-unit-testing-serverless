exports.handler = function (context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  context
    .getTwilioClient()
    .messages.create({
      to: event.to,
      from: context.OUTBOUND_PHONE_NUMBER,
      body: 'Hello world!',
    })
    .then((msg) => {
      response.setBody({ success: true, sid: msg.sid })
      callback(null, response);
    })
    .catch((err) => {
      response.setBody({ success: false, errore: JSON.stringify(error) })
      callback(null, response);
    });
};
