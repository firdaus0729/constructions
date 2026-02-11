#!/bin/bash
# Script to set up trusted HTTPS certificates using mkcert

echo "Setting up trusted HTTPS certificates for localhost..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed."
    echo ""
    echo "To install mkcert on Linux, run one of these commands:"
    echo ""
    echo "Option 1 (using package manager if available):"
    echo "  sudo apt install mkcert  # Debian/Ubuntu"
    echo "  # or"
    echo "  sudo pacman -S mkcert     # Arch Linux"
    echo ""
    echo "Option 2 (manual installation):"
    echo "  curl -JLO 'https://dl.filippo.io/mkcert/latest?for=linux/amd64'"
    echo "  chmod +x mkcert-v*-linux-amd64"
    echo "  sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert"
    echo ""
    echo "After installing mkcert, run this script again."
    exit 1
fi

# Create certs directory if it doesn't exist
mkdir -p certs

# Install local CA (only needs to be done once per machine)
echo "Installing local CA (you may be prompted for your password)..."
mkcert -install

# Generate certificates for localhost
echo "Generating certificates for localhost..."
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1

echo ""
echo "✅ Certificates generated successfully!"
echo "Your app will now work with https://localhost:3000 without browser warnings."
echo ""
echo "To start your app, run: npm run dev"

