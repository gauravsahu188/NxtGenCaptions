#!/usr/bin/env bash
# ==============================================================================
# Script: setup-ec2.sh
# Purpose: One-time EC2 server initialization script for nxtgencaptions.com
# Run this once on a fresh Ubuntu 22.04 / 24.04 LTS EC2 instance
# ==============================================================================

set -euo pipefail

echo "=================================================="
echo "Initializing EC2 Instance for nxtgencaptions.com"
echo "=================================================="

# 1. Update OS packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip build-essential nginx certbot python3-certbot-nginx

# 2. Configure 4GB Swap Space (Crucial for Next.js builds on t2/t3 instances)
if [ ! -f /swapfile ]; then
  echo "Setting up 4GB swap memory..."
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo "Swap configured successfully."
else
  echo "Swapfile already exists."
fi

# 3. Install Node.js 20 LTS via NVM
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing NVM and Node.js 20..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
else
  echo "NVM already installed."
fi

# 4. Install PM2 globally
npm install -g pm2
pm2 startup systemd -u "$USER" --hp "$HOME" || true

# 5. Create application directory if not already created
APP_DIR="/var/www/nxtgencaptions"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

echo "=================================================="
echo "EC2 Setup Completed!"
echo "Next steps:"
echo "1. Clone your repository into $APP_DIR"
echo "2. Create .env.local with your production credentials in $APP_DIR"
echo "3. Copy infrastructure/nginx/nxtgencaptions.com.conf to /etc/nginx/sites-available/"
echo "4. Run: sudo ln -s /etc/nginx/sites-available/nxtgencaptions.com.conf /etc/nginx/sites-enabled/"
echo "5. Run: sudo nginx -t && sudo systemctl reload nginx"
echo "6. Run: sudo certbot --nginx -d nxtgencaptions.com -d www.nxtgencaptions.com"
echo "=================================================="
