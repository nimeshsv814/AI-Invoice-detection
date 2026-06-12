# AI Invoice Detection

Dockerized invoice processing platform with a React frontend, Node/TypeScript microservices, PostgreSQL, Redis, local OCR extraction, duplicate detection, fraud scoring, approvals, notifications, and analytics.

## OCR And Fraud Logic

This project does not require Bedrock, Textract, or any AWS managed AI model.

The OCR service supports:

- `local`: uses bundled/manual libraries in the OCR container.
  - `pdf-parse` extracts text from text-based PDFs.
  - `tesseract.js` extracts text from PNG/JPG/JPEG invoice images.
- `simulation`: generates demo invoice data when you do not want real OCR.

The fraud service uses local rule-based scoring against extracted invoice fields, vendor history, amount patterns, tax checks, PO checks, date anomalies, duplicate checks, and OCR confidence.

Use this in `.env` for real local-library processing:

```env
OCR_ENGINE=local
OCR_LANGUAGE=eng
OCR_FALLBACK_TO_SIMULATION=true
```

Set `OCR_FALLBACK_TO_SIMULATION=false` if you want OCR failures to stop processing instead of falling back to demo data.

Note: scanned PDFs are different from text-based PDFs. This setup handles text-based PDFs and image uploads. For scanned PDFs, upload the invoice as PNG/JPG/JPEG or add a PDF-to-image converter such as Poppler later.

## Local Run

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

Open:

- Frontend: `http://localhost`
- Optional API gateway port: `http://localhost:8080`

Seed login:

- Email: `admin@invoiceai.com`
- Password: `Admin@1234`

## EC2 Deployment

Recommended EC2 size for all containers on one machine: `t3.large` or larger, 30 GB disk minimum. For testing, `t3.medium` may work but can be tight during image builds.

1. Launch an EC2 instance.

   Use Amazon Linux 2023. In the security group, allow:

   - SSH `22` from your IP only
   - HTTP `80` from users
   - Optional `8080` from your IP only

   No Bedrock, Textract, or AI IAM role is required.

2. SSH into EC2.

   ```bash
   ssh -i your-key.pem ec2-user@EC2_PUBLIC_IP
   ```

3. Install Docker and Git.

   ```bash
   sudo yum update -y
   sudo yum install -y docker git
   sudo service docker start
   sudo systemctl enable docker
   sudo usermod -aG docker ec2-user
   newgrp docker
   docker --version
   ```

4. Install Docker Compose v2 if `docker compose version` fails.

   ```bash
   docker compose version || {
     mkdir -p ~/.docker/cli-plugins
     curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o ~/.docker/cli-plugins/docker-compose
     chmod +x ~/.docker/cli-plugins/docker-compose
   }
   docker compose version
   ```

5. Put the project on EC2.

   Using Git:

   ```bash
   git clone YOUR_REPO_URL
   cd AI-Invoice-detection
   ```

   Or upload from your local machine:

   ```bash
   scp -i your-key.pem -r AI-Invoice-detection ec2-user@EC2_PUBLIC_IP:/home/ec2-user/
   ```

6. Configure production environment.

   ```bash
   cp .env.example .env
   nano .env
   ```

   Important values:

   ```env
   DB_PASSWORD=change-this-strong-password
   JWT_SECRET=change-this-long-random-secret
   JWT_REFRESH_SECRET=change-this-other-long-random-secret
   CORS_ORIGIN=http://EC2_PUBLIC_IP
   FRONTEND_PORT=80
   API_GATEWAY_PORT=8080
   OCR_ENGINE=local
   OCR_LANGUAGE=eng
   OCR_FALLBACK_TO_SIMULATION=true
   ```

7. Build and start.

   ```bash
   docker compose up --build -d
   docker compose ps
   ```

8. Check health and logs.

   ```bash
   curl http://localhost/health
   curl http://localhost/health/ocr
   docker compose logs -f ocr-service
   ```

9. Open the app.

   Visit `http://EC2_PUBLIC_IP`, log in, and upload an invoice. With `OCR_ENGINE=local`, invoice extraction runs inside your own OCR container.

## Useful Operations

View logs:

```bash
docker compose logs -f
docker compose logs -f frontend
docker compose logs -f ocr-service
```

Restart after env changes:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

Reset database and uploads:

```bash
docker compose down -v
docker compose up --build -d
```
