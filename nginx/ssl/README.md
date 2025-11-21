# SSL Certificates

This directory will contain SSL certificates for HTTPS.

## Development Setup (Self-Signed Certificates)

For local development, you can create self-signed certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Production Setup (Let's Encrypt)

For production deployment on GCP VM, use Certbot to obtain free SSL certificates:

### Option 1: Using Certbot with Docker Compose

1. Add certbot service to docker-compose.yml (see DEPLOYMENT.md)
2. Run: `docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d your-domain.com`
3. Certificates will be stored in this directory
4. Uncomment HTTPS server block in nginx/conf.d/app.conf

### Option 2: Manual Setup on VM

1. SSH into your GCP VM
2. Install certbot: `sudo apt install certbot python3-certbot-nginx`
3. Obtain certificate: `sudo certbot certonly --standalone -d your-domain.com`
4. Copy certificates to this directory:
   ```bash
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./
   ```
5. Restart nginx: `docker-compose restart nginx`

## Certificate Renewal

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

### With Docker Compose
Add to crontab:
```bash
0 0 * * * cd /path/to/project && docker-compose run --rm certbot renew && docker-compose restart nginx
```

### Manual
```bash
0 0 * * * certbot renew --quiet && docker-compose restart nginx
```

## Files

- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key
- `.gitignore` - Ensures certificates are not committed to git
