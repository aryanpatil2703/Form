# AWS deployment with a fixed SelectHub IP

This deployment uses one Ubuntu EC2 instance with an Elastic IP. The Elastic IP is the stable public address used for outbound requests to SelectHub, so SelectHub can whitelist it.

For a highly available production setup, use ECS/Fargate behind an Application Load Balancer with a NAT Gateway and Elastic IP. The EC2 path below is the simplest reliable deployment for the current platform.

## 1. Create the AWS resources

1. Launch an Ubuntu 24.04 EC2 instance in a public subnet.
2. Choose at least 2 vCPU and 4 GB RAM for the initial deployment.
3. Create and associate an Elastic IP with the instance. Record it as `AWS_STATIC_IP`.
4. Configure the security group:
   - TCP 22: only your office/deployment IP.
   - TCP 80: `0.0.0.0/0`.
   - TCP 443: `0.0.0.0/0`.
   - Do not expose port 3000 publicly.
5. Create a MongoDB Atlas cluster. Add the EC2 Elastic IP to the Atlas IP access list, create a database user, and record the connection string as `MONGODB_URI` plus the database name as `MONGODB_DB`.
6. Give SelectHub the Elastic IP and ask them to whitelist it for the Relay API.

An Elastic IP remains assigned across instance reboots. If the instance is replaced, re-associate the same Elastic IP before starting the replacement.

## 2. Install the runtime on EC2

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin nginx git
sudo systemctl enable --now docker nginx
sudo usermod -aG docker "$USER"
```

Log out and back in once so the Docker group change takes effect.

## 3. Deploy the application

Clone the repository on the instance, then run:

```bash
git clone YOUR_REPOSITORY_URL selecthub-platform
cd selecthub-platform
mkdir -p data public/uploads
chmod 700 data public/uploads
cp deploy/aws/.env.production.example deploy/aws/.env.production
nano deploy/aws/.env.production
```

Set these values in `.env.production`:

```env
SELECTHUB_RELAY_URL=https://prod-relay.herokuapp.com/api/relay
SELECTHUB_MOCK=false
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=use-a-long-random-password
ADMIN_SESSION_SECRET=use-a-different-long-random-secret
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=selecthub
```

Start the container:

```bash
docker compose -f deploy/aws/docker-compose.yml up -d --build
sudo cp deploy/aws/nginx.conf /etc/nginx/sites-available/selecthub-platform
sudo ln -sfn /etc/nginx/sites-available/selecthub-platform /etc/nginx/sites-enabled/selecthub-platform
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

The application is now available on the instance's Elastic IP over HTTP. Add DNS and HTTPS with an ACM-backed load balancer or Certbot before collecting real personal data.

## 4. Verify the static outbound IP

From the EC2 instance:

```bash
curl https://checkip.amazonaws.com
```

The result must equal the Elastic IP supplied to SelectHub. Then submit a test lead and check the container logs:

```bash
docker compose -f deploy/aws/docker-compose.yml logs -f selecthub-platform
```

A successful delivery includes `SelectHub submission successful`. A Relay `403` or similar response usually means the Elastic IP has not been whitelisted yet.

## 5. Records and persistence

`MONGODB_URI` and `MONGODB_DB` are required in production. The submission dashboard stores the timestamp, campaign, lead fields, generated scorecard ID, hidden SelectHub payload, and delivery status in MongoDB. Add the EC2 Elastic IP to the MongoDB Atlas IP access list. Campaign configuration and uploaded campaign assets use the EC2 EBS volume through the compose bind mounts, so back up the instance volume and database. Do not rely on the local JSON submission fallback in production.

## Security

Use AWS Systems Manager Session Manager instead of exposing SSH where possible. Restrict the database to the app security group, keep secrets only in `.env.production` with mode `600`, enable automatic OS security updates, and put HTTPS in front of the application before production use.
