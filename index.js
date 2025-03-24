/*
    Sends a message to gotify server for each alert that fires from Prometheus
    Alertmanager.
    
    Copyright (C) 2020  Andrew Miller

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

*/
const http = require('http');
const connect = require('connect');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = connect();
app.use(bodyParser.json());

app.use(async (req, res) => {
    const alerts = req.body;

    if (!Array.isArray(alerts)) {
        console.error("Invalid payload: Expected array of alerts");
        res.statusCode = 400;
        return res.end("Invalid payload format");
    }

    for (const alert of alerts) {
        const labels = alert.labels || {};
        const annotations = alert.annotations || {};

        const title = annotations.title || `Alert: ${labels.alertname || 'Unknown'}`;
        const message = annotations.description || annotations.summary || 'No description provided';
        const priority = parseInt(annotations.priority || '5');

        const formattedMessage = `
🚨 *${title}*
📁 Folder: ${labels.grafana_folder || 'N/A'}
📌 Instance: ${labels.instance || 'N/A'}
💾 Volume: ${labels.volume || 'N/A'}
📝 Description: ${message}
🔗 View alert: ${alert.generatorURL || 'N/A'}
`.trim();

        const body = {
            title,
            message: formattedMessage,
            priority
        };

        try {
            console.log("Dispatching:", JSON.stringify(body));
            const response = await fetch(process.env.GOTIFY_MESSAGE_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "X-Gotify-Key": process.env.GOTIFY_TOKEN
                }
            });

            if (!response.ok) {
                console.error(`Gotify returned HTTP ${response.status}`);
            } else {
                console.log("Sent to Gotify successfully.");
            }

        } catch (err) {
            console.error("Error sending to Gotify:", err.message);
        }
    }

    res.end("SUCCESS\n");
});

const server = http.createServer(app)
    .listen(parseInt(process.env.LISTEN_PORT || '8435'), process.env.LISTEN_ADDR || '::', () => {
        console.log(`Webhook-Gotify Adapter listening on ${process.env.LISTEN_ADDR || '::'}:${process.env.LISTEN_PORT || '8435'}`);
    });

