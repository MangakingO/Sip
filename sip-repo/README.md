# Sip

A drink-level review platform for coffee, tea, and matcha.

Every mainstream review platform rates the wrong unit. Yelp and Google score a
*coffee shop* — a blend of ambiance, seating, Wi-Fi, and service, with drink
quality buried somewhere inside. A four-star rating tells you nothing about
whether their oat milk latte is any good.

Sip scores the *drink*. Search "Oat Milk Latte" and see every reviewed version
across the metro, ranked on drink quality alone.

Reviews attach to a preloaded menu item at a specific location rather than to
free text. That constraint is what makes cross-location aggregation possible,
and it is why incumbents cannot retrofit the feature onto millions of existing
free-text reviews.

**Course:** CSE 4333/5333 Cloud Computing, University of Texas at Arlington
**Team:** Oscar Barrios Jimenez (oxb3281) · Evan Willsey (exw1419)
**Status:** Midpoint — backend deployed and working; mobile client not yet built

---

## Architecture

Deployed to AWS `us-east-2` as a single CloudFormation stack.

```
                        ┌──────────────────────┐
  Browser / Expo ──────▶│  Amazon Cognito      │  sign-in, issues a JWT
                        └──────────┬───────────┘
                                   │ JWT
                        ┌──────────▼───────────┐
                        │  API Gateway (HTTP)  │  validates the JWT at the edge
                        └──────────┬───────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
 ┌───────▼────────┐      ┌─────────▼────────┐      ┌─────────▼────────┐
 │ presignUpload  │      │  createReview    │      │  listRankings    │
 │   (Lambda)     │      │  (Lambda, VPC)   │      │  (Lambda, VPC)   │
 └───────┬────────┘      └─────────┬────────┘      └─────────┬────────┘
         │ presigned PUT           │                         │
         │                         └────────┬────────────────┘
 ┌───────▼────────┐                ┌────────▼─────────┐
 │  S3: photos    │                │  RDS PostgreSQL  │
 │  originals/    │                │  (private, VPC)  │
 └───────┬────────┘                └────────▲─────────┘
         │ s3:ObjectCreated                 │
 ┌───────▼────────┐                         │
 │  processPhoto  │─────────────────────────┘
 │ (Lambda, VPC)  │  strips EXIF, writes thumbs/, updates the review row
 └────────────────┘
```

### Why it is shaped this way

**Photos never pass through Lambda.** The client requests a presigned URL and
`PUT`s the file straight to S3. Generating that URL is local signing with no API
call, so the function stays fast regardless of photo size and never hits API
Gateway's payload limit.

**No NAT gateway.** A Lambda inside a VPC has no outbound internet route, and
adding one costs roughly $32/month — outside the free tier. Two decisions remove
the need: API Gateway's Cognito authorizer validates the JWT before any function
runs, so no function has to reach Cognito; and an S3 gateway VPC endpoint carries
photo traffic privately.

**Uploads are event-driven.** Writing to `originals/` triggers `processPhoto`
rather than making the user wait on thumbnailing during the request.

**The database is private.** RDS sits in the VPC behind a security group that
admits only the Lambda security group, plus one developer CIDR for loading the
schema.

**One review per unmodified drink per user.** Expressed as a partial unique index
on `(user_id, drink_id) WHERE modified = false`, because modified orders are
deliberately allowed to duplicate. Posting the same drink twice updates the first
review instead of creating a second.

---

## Repository layout

```
infrastructure/
  template.yaml     AWS SAM — VPC, RDS, S3, Cognito, API Gateway, four Lambdas
  schema.sql        Tables, the one-review-per-drink index, seed data
backend/
  src/handlers/     presignUpload · createReview · listRankings · processPhoto
  src/lib/          Connection pooling and HTTP helpers
web/
  index.html        Single-page demo client used in the walkthrough
docs/
  screens.html      Interactive design mockups — 17 screens
  screens/          Rendered PNG of each screen
  Sip-Screens.pdf   Print version of the screen designs
  MIDPOINT_REPORT.md
  DEMO_SCRIPT.md    Recording plan for the demo video
  build_deck.js     Regenerates the presentation
```

Design and implementation are intentionally separate at this stage. The screens
in `docs/` are mockups; the working system is the API and data layer below.

---

## API

All routes require a Cognito JWT in the `Authorization` header. API Gateway
rejects unauthenticated requests before any function runs.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/uploads` | Returns a presigned S3 URL, valid five minutes |
| `POST` | `/reviews` | Creates a review, or updates the existing one |
| `GET` | `/rankings?drink=<name>` | Ranks that drink across every location |

---

## Deploying

Everything below runs in **AWS CloudShell**, which has the AWS CLI, SAM, Node and
`psql` preinstalled and already authenticated — no local setup and no Docker. All
dependencies are pure JavaScript, so `sam build` needs no container.

```bash
cd backend && npm install && cd ../infrastructure
MYIP=$(curl -s https://checkip.amazonaws.com)
sam build
sam deploy --guided --parameter-overrides DbPassword=<choose-one> MyIp=$MYIP/32
```

Choose a region your account actually permits. On an account managed by an AWS
organization, a service control policy may deny most services outside the
project's selected region — ours denies `us-east-1`, so this stack runs in
`us-east-2`.

`DbPassword` is a `NoEcho` parameter, so SAM does not save it to
`samconfig.toml`. Later deploys need it again:

```bash
sam deploy --parameter-overrides 'DbPassword=<yours>' 'MyIp=<your-ip>/32'
```

The first deploy takes ten to fifteen minutes, almost all of it RDS. The outputs
give the API URL, Cognito IDs, bucket name and database endpoint.

### Load the schema

```bash
PGPASSWORD='<yours>' psql -h <db-endpoint> -U sipadmin -d sip -f schema.sql
```

Use `PGPASSWORD` rather than a `postgresql://` URL — a password containing `#`
is read as the start of a URL fragment and silently truncated.

### Create a test user

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <pool-id> --username you@example.com --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id <pool-id> --username you@example.com \
  --password '<password>' --permanent
```

### Host the demo client

The client must be served over HTTP. API Gateway returns no CORS headers for the
`null` origin a `file://` page sends, and `null` cannot be allowlisted because
the service validates origin format.

```bash
BUCKET=sip-client-<account-id>
aws s3api create-bucket --bucket $BUCKET --region us-east-2 \
  --create-bucket-configuration LocationConstraint=us-east-2
aws s3api delete-public-access-block --bucket $BUCKET
aws s3api put-bucket-policy --bucket $BUCKET --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::$BUCKET/*\"}]}"
aws s3 website s3://$BUCKET --index-document index.html
aws s3 cp web/index.html s3://$BUCKET/index.html
echo "http://$BUCKET.s3-website.us-east-2.amazonaws.com"
```

### Tear down

```bash
sam delete
```

The client bucket is outside the stack and is removed separately.

---

## Current status

| Capability | Status |
|---|---|
| Cognito sign-up and sign-in | Working |
| JWT enforcement on protected routes | Working |
| Presigned photo upload direct to S3 | Working |
| Review creation with update-in-place | Working |
| Event-driven thumbnailing and EXIF stripping | Working |
| Cross-location drink rankings | Working |
| Infrastructure as code (SAM) | Working |
| Expo mobile client | Not started |
| Google Places integration | Not started |
| Weighted ranking and weekly standings | Not started |
| Comments, saved list, reputation, business accounts | Not started |

---

## Known limitations

- **The database password is a template parameter.** `cfn-lint` flags this, and
  it is correct to. The production answer is Secrets Manager generating and
  rotating the password; it is a parameter here to keep the course project
  reproducible from one command.
- **Thumbnails ignore EXIF orientation.** `jimp` was chosen over `sharp` because
  it is pure JavaScript and needs no container build, which is what lets the
  whole stack deploy from CloudShell. It does not apply orientation metadata, so
  portrait phone photos can appear rotated.
- **Drink menus are seeded by hand.** Two Fort Worth shops with three drinks each.
  Populating real menus is an operations problem, not a coding one, and is the
  main risk to a real launch.
- **Ranking uses a raw average.** A drink with one five-star review currently
  outranks one with two hundred at 4.8. A weighted average that pulls low-count
  drinks toward the city mean is required before any leaderboard is meaningful.

---

## Credits

Built for CSE 4333/5333 at UT Arlington. Course material and the AWS Academy labs
informed the architecture, particularly the S3 static website, versioning and
lifecycle patterns from Module 3.
