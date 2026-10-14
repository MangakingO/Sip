# Demo video script (target 7 minutes)

Record with Zoom screen share or OBS. One take is fine. Deploy first and have the
AWS console tabs already open so no time is lost loading pages.

## Before recording

- Stack deployed, schema loaded, test user created
- The demo client open from its S3 website URL, with API URL and client ID filled in
  (a page opened from `file://` sends a `null` origin, which API Gateway rejects)
- Grab a drink UUID: `psql ... -c "SELECT id, name FROM drinks LIMIT 3;"`
- Console tabs open: Lambda, S3 bucket, CloudWatch log group for processPhoto, RDS
- A drink photo saved on the desktop

## 0:00 — What this is (30s)

Sip rates drinks rather than coffee shops. Show the demo page, say what you're
about to prove: a review goes in, a photo lands in S3, a function fires on its
own, and the drink ranks across locations.

## 0:30 — Authentication (45s)

Sign in. Open DevTools Network, show the Cognito response carrying an ID token.

Then show the failure case, which is more convincing than the success: send a
request without the token and show API Gateway returning 401. Point out your code
never ran — the authorizer rejected it at the edge.

```bash
curl -i <API_URL>/reviews -X POST -d '{}'
```

## 1:15 — Upload and the presigned URL (90s)

Pick a photo, post a review. In the Network tab, walk the three calls:

1. `POST /uploads` returns a URL with a signature in the query string
2. `PUT` goes to `s3.amazonaws.com`, not your API — the image never touches Lambda
3. `POST /reviews` writes the row

Open the S3 console and show the object under `originals/`.

## 2:45 — Event-driven processing (90s)

Refresh the bucket and show `thumbs/` now exists. Open the processPhoto log group
in CloudWatch and show the log line — nobody called this function, the S3 event
did. Open the thumbnail and note EXIF is gone, so GPS from the phone is not stored.

## 4:15 — The actual feature (90s)

Search "Oat Milk Latte" in the demo page. Show the same drink ranked across two
locations. Say plainly why Yelp can't do this: their reviews are free text and
can't be decomposed per drink after the fact.

Post a second review of the same drink and show the count stays at one and the
rating updates — that's the one-review-per-drink constraint, enforced by a partial
unique index.

## 5:45 — Infrastructure as code (45s)

Show `template.yaml` scrolled to the VPC and RDS sections. Mention the stack is
reproducible from one command and that you have torn it down and redeployed it.

## 6:30 — Where it stands (30s)

Name what's left: Expo client, menu import, CloudFront. Name the main risk: menu
data entry is manual.

## Rules

- Do not apologise for unfinished parts; say what's next instead
- If something fails on camera, narrate the error and keep going — reading a real
  stack trace shows more understanding than a clean take
- Upload unlisted to YouTube or share from Drive with link access on, then test
  the link in a private window before submitting
