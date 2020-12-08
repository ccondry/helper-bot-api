#!/bin/sh
echo "running yarn"
yarn
if [ $? -eq 0 ]; then
  echo "edit .env file first"
  vim .env
  echo "installing systemd service..."
  sudo cp systemd.service /lib/systemd/system/helper-bot-api.service
  echo "enabling systemd service..."
  sudo systemctl enable helper-bot-api.service
  echo "starting systemd service..."
  systemctl start helper-bot-api.service
  echo "install helper-bot-api.service is complete."
else
  echo "yarn failed"
fi
