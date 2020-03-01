const http = require('http');
const connect = require('connect');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = connect();
app.use(bodyParser.json());

app.use(async (req, res) => {
  console.log("Input", req.body);
  for (const alertId in req.body.alerts) {
    const alert = req.body.alerts[alertId];
    if (alert.status !== "firing")
      continue;
    const annotations = Object.assign({}, req.body.commonAnnotations,
                                      alert.annotations);
    const body = {
      title: annotations.title,
      message: annotations.description,
      priority: parseInt(annotations.priority || "5")
    };
    console.log("Dispatching", body);
    await fetch(process.env.GOTIFY_MESSAGE_ENDPOINT,
                { method: 'POST', body: JSON.stringify(body),
                  headers: { "Content-Type": "application/json",
                             "X-Gotify-Key": process.env.GOTIFY_TOKEN
                           }});
  }
  res.end("SUCCESS\n");
});

const server = http.createServer(app)
  .listen(parseInt(process.env.LISTEN_PORT || '8435'),
                   process.env.LISTEN_ADDR || '::');
