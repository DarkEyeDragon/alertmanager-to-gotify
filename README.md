# alertmanager-to-gotify

A really simple Node app to send a message to [gotify server](https://gotify.net) - from
where it can be sent to your mobile device or browser - for each alert that fires
from [Prometheus Alertmanager](https://prometheus.io/docs/alerting/alertmanager/).

# Setup

Before starting alertmanager-to-gotify, you will need to create a new application
in Gotify. From the web UI, click on Apps, then Create Application. Once created,
you will need the token from the application (reveal it by clicking the eye icon).

The easiest way to get it running locally is with Docker. You can spin it to run
on port 8435 with a command like the following (replacing xxxxxxxxxxxxxxx with your
actual token):

```
docker run -d --restart=unless-stopped \
    -p 127.0.0.1:8435:8435 \
    -e GOTIFY_TOKEN=xxxxxxxxxxxxxxx \
    --link gotify-server \
    -e GOTIFY_MESSAGE_ENDPOINT=http://gotify-server/message \
    --name alertmanager-to-gotify a1kmm/alertmanager-to-gotify
```

This assumes you already have a container also running locally called gotify-server -
if not, you could remove the `--link gotify-server` option and change the
`GOTIFY_MESSAGE_ENDPOINT`.

To get it to work, configure Prometheus Alertmanager to send via a webhook to
alertmanager-to-gotify. Set up a receiver in `alertmanager.yml` like the following:
```
  webhook_configs:
  - url: http://localhost:8435/
```

alertmanager-to-gotify bases the alert sent off three annotations that you should
set for each alert in your rules file.

* description - becomes the message alerted through gotify.
* title - becomes the title of the gotify notification.
* priority - controls the gotify priority (which can be configured to alert differently).

For example:
```
groups:
  - name: test
    rules:
     - alert: MyTestRule
       expr: node_network_carrier{interface="wlan2"} < 1 or absent(node_network_carrier{interface="wlan2"})
       for: 5s
       annotations:
         description: This suggests the wifi might be down
         title: wlan2 carrier
         priority: 5
```
