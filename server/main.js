const app = require("express")();
const https = require("https");
const fs = require("fs");
const winston = require("winston");
const expressWinston = require("express-winston");

const PRIVATE_KEY_PASSPHRASE = process.env.PRIVATE_KEY_PASSPHRASE;
const SERVER_PORT = 3000;
const FINGERPRINT256 = process.env.FINGERPRINT;

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.prettyPrint()
    })
  );
}

logger.info("Starting server...");

const opts = {

  // this is the normal server HTTPS certificate
  key: fs.readFileSync("../certs/tls.key"),
  cert: fs.readFileSync("../certs/tls.crt"),
  passphrase: PRIVATE_KEY_PASSPHRASE,

  // if true, the client certificate will be requested during SSL
  // negotiation. Note that the client may still
  // decide to not send the certificate.
  requestCert: true,

  // If set to true, this will block clients that don't present
  // certificate or the presented certificate is not signed
  // by the CA below.
  rejectUnauthorized: false,

  // This is the CA that is used to 'authorize' the client
  // Note that in this case, 'authorization' just means that any certificate 
  // signed by this CA is valid.
  //ca: [fs.readFileSync("../certificates/distinct-ca/ca-client.crt")]
};

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.prettyPrint()
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTPS {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function(req, res) {
      return false;
    } // optional: allows to skip some log messages based on request and/or response
  })
);

//GET home route
app.get("/", (req, res) => {
  res.send('<a href="authenticate">Log in using client certificate</a>');
});

app.get("/url", (req, res, next) => {

const cert = req.connection.getPeerCertificate();
/*
  if (!req.client.authorized) {
    res
      .status(403)
      .send(
        `Sorry ${cert.subject.CN}, certificates from ${
          cert.issuer.CN
        } are not allowed.`
      );
    return;
  }
*/
  // Example for how an API implementation can enforce which clients can call it.
  // Here, we are doing it on a per API basis. Depending on how sofisticated
  // we want this to be, maybe we can have a general hook that handles this check for 
  // all resources.
  if (!cert || !cert.fingerprint256) {
    logger.error("No client certificate provided!");
    res
      .status(401)
      .send(`Sorry, but you need to provide a client certificate to continue.`);
    return;
  }
  const requestFingerprint = cert.fingerprint256;

  if (FINGERPRINT256 !== requestFingerprint) {
    res
      .status(403)
      .send(
        `Unacceptable certificate from ${cert.subject.CN}, certificates from ${cert.issuer.CN}/${requestFingerprint} are not allowed.`
      );
    return;
  }

  res.json({list: ["Duke", "Health", "University", "Hospital", "Clinics"]});
});

app.get("/authenticate", (req, res) => {
  const cert = req.connection.getPeerCertificate();

  if (!cert) {
    logger.error("No client certificate provided!");
    res
      .status(401)
      .send(`Sorry, but you need to provide a client certificate to continue.`);
    return;
  }

  if (req.client.authorized) {
    res.send(
      `Hello ${cert.subject.CN}, your certificate was issued by ${
        cert.issuer.CN
      }!`
    );
  } else if (cert.subject) {
    res
      .status(403)
      .send(
        `Sorry ${cert.subject.CN}, certificates from ${
          cert.issuer.CN
        } are not welcome here.`
      );
  } else {
    res
      .status(401)
      .send(`Sorry, but you need to provide a client certificate to continue.`);
  }
});

logger.info("Server listening on port " + SERVER_PORT);

// we will pass our 'app' to 'https' server
https.createServer(opts, app).listen(SERVER_PORT);