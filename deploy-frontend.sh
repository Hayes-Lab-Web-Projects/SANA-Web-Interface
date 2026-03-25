#! /bin/bash
# should be placed in the root directory of the project

cd frontend
echo "Building static production files..."
npm run build
echo "Copying build files into /var/www/SANA_Website/..."
sudo mkdir -p /var/www/SANA_Website/
sudo cp -r dist/* /var/www/SANA_Website/
echo "Adding read permissions..."
sudo chmod -R 755 /var/www/SANA_Website/
sudo nginx -t
echo "Restarting nginx server..."
sudo systemctl reload nginx
sudo systemctl restart nginx
echo "Nginx status:"
sudo systemctl status nginx



