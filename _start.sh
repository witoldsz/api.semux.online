#!/bin/bash

# example startup script
SEMUX_API_ADDR=http://localhost:5171 \
SEMUX_API_USER=user \
SEMUX_API_PASS=123456 \
API_SEMUX_ONLINE_PORT=4444 \
API_SEMUX_ONLINE_HOST=localhost \
node main.js
