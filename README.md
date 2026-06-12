# AI Invoice Detection

Dockerized invoice processing platform with a React frontend, Node/TypeScript microservices, PostgreSQL, Redis, local OCR extraction, duplicate detection, fraud scoring, approvals, notifications, and analytics.

## OCR And Fraud Logic

This project uses local OCR and rule-based fraud scoring by default. You can optionally enable Gemini API key based fraud explanation enhancement.

The OCR service supports:

- `local`: uses bundled/manual libraries in the OCR container.
  - `pdf-parse` extracts text from text-based PDFs.
  - `tesseract.js` extracts text from PNG/JPG/JPEG invoice images.
- `simulation`: generates demo invoice data when you do not want real OCR.

The fraud service uses local rule-based scoring against extracted invoice fields, vendor history, amount patterns, tax checks, PO checks, date anomalies, duplicate checks, and OCR confidence.

Optionally, Gemini can improve the human-readable fraud explanation and recommendations after the local rule score is calculated. Gemini does not replace the rule score, risk level, or approval recommendation.

Use this in `.env` for real local-library processing:

```env
OCR_ENGINE=local
OCR_LANGUAGE=eng
OCR_FALLBACK_TO_SIMULATION=true
```

Set `OCR_FALLBACK_TO_SIMULATION=false` if you want OCR failures to stop processing instead of falling back to demo data.

To enable Gemini explanation enhancement, set:

```env
GEMINI_ENABLED=true
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash
```

Leave `GEMINI_ENABLED=false` to run fully without Gemini.

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

   Use Ubuntu Server 22.04 LTS or 24.04 LTS. In the security group, allow:

   - SSH `22` from your IP only
   - HTTP `80` from users
   - Optional `8080` from your IP only

   No Bedrock, Textract, or AI IAM role is required.

2. SSH into EC2.

   ```bash
   ssh -i your-key.pem ubuntu@EC2_PUBLIC_IP
   ```

3. Install Docker, Docker Compose, and Git.

   ```bash
   sudo apt-get update
   sudo apt-get install -y ca-certificates curl git
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc

   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
     $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo usermod -aG docker ubuntu
   newgrp docker
   docker --version
   docker compose version
   ```

4. Put the project on EC2.

   Using Git:

   ```bash
   git clone YOUR_REPO_URL
   cd AI-Invoice-detection
   ```

   Or upload from your local machine:

   ```bash
   scp -i your-key.pem -r AI-Invoice-detection ubuntu@EC2_PUBLIC_IP:/home/ubuntu/
   ```

5. Configure production environment.

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
   GEMINI_ENABLED=true
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.5-flash
   ```

6. Build and start.

   ```bash
   docker compose up --build -d
   docker compose ps
   ```

7. Check health and logs.

   ```bash
   curl http://localhost/health
   curl http://localhost/health/ocr
   docker compose logs -f ocr-service
   ```

8. Open the app.

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
