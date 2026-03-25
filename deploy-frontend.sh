#! /bin/bash

directory="$HOME/app/frontend"
cd $directory
echo "Building static production files..."
npm run build
echo "Copying build files into /var/www/SANA_Website/..."
mkdir -p /var/www/SANA_Website/
sudo cp -r dist/* /var/www/SANA_Website/
echo "Adding read permissions..."
sudo chmod -R 755 /var/www/SANA_Website/
mkdir -p /etc/nginx/sites-available/SANA_Website/
sudo ln -s /etc/nginx/sites-available/SANA_Website /etc/nginx/sites-enabled/
sudo nginx -t
echo "Restarting nginx server..."
sudo systemctl reload nginx
sudo systemctl restart nginx
echo "Nginx status:"
sudo systemctl status nginx



