# api.semux.online proxy server

This is the original Semux API without the node's wallet direct operations and with no authorization and authentication.

## Install

### Prerequisites

- install, enable API endpoint and launch Semux node, see instalation instructions at https://semux.org
- Node.JS (with npm) https://nodejs.org/en/

### Install api.semux.online proxy server

- `git clone https://github.com/witoldsz/api.semux.online.git`
- `cd api.semux.online`
- `npm install`
- `cp _start.sh start.sh`
- adjust start.sh script:
  - `SEMUX_API_ADDR` is the URL of the Semux API full node
  - `SEMUX_API_USER` and SEMUX_API_PASS must match Semux API full node
  - `API_SEMUX_ONLINE_PORT` is the port this proxy should listen on
  - `API_SEMUX_ONLINE_HOST` must point to the interface to bind to (i.e. `0.0.0.0` for all IPv4)

### Optionally
- install some HTTPS proxy server (i.e. haproxy, caddy)
- schedule launch, i.e. for systemd:
  - `/etc/systemd/service/api-semux.online.service`
    ```
    [Unit]
    Description=api.semux.online
    After=network.target

    [Service]
    User=semux
    Group=semux
    Type=simple
    Restart=on-failure

    WorkingDirectory=/PATH_TO/api.semux.online
    ExecStart=/PATH_TO/api.semux.online/start.sh

    [Install]
    WantedBy=multi-user.target

```
