# Sip — Midpoint Report

**Course:** CSE 4333/5333 Cloud Computing
**Team:** Oscar Barrios Jimenez (oxb3281), Evan Willsey (exw1419)
**Repository:** <add GitHub URL>
**Deployed:** AWS us-east-2, stack `sip`
**Demo video:** <add link>

## 1. Project overview

Sip is a drink-level review platform for coffee, tea, and matcha. Mainstream
review platforms score a venue, blending ambiance, seating, and service into one
number that says nothing about whether a particular drink is good. Sip scores the
drink: search a drink name and see every reviewed version across the metro,
ranked on drink quality alone.

Reviews attach to a preloaded menu item rather than free text. That constraint is
what makes cross-location aggregation possible, and it is why incumbents cannot
retrofit the feature onto millions of existing free-text reviews.

## 2. Architecture

See `README.md` for the component diagram.

Request path: the client authenticates against Cognito and attaches the resulting
JWT to every call. API Gateway validates that token before invoking any function.
Functions that read or write data run inside the VPC and reach RDS PostgreSQL
over a security group that admits only them.

Photo path: the client requests a presigned URL, then PUTs the image directly to
S3. The object-created event triggers a separate function that strips EXIF data,
writes a thumbnail, and updates the review row.

### Design decisions worth noting

**No NAT gateway.** A Lambda inside a VPC has no outbound internet route. Our
first design called Cognito from inside the function, which would have required a
NAT gateway at roughly $32/month. Moving token validation to the API Gateway
authorizer removed the dependency. An S3 gateway VPC endpoint carries photo
traffic privately for the same reason.

**Presigned uploads.** Routing images through Lambda would mean paying for
execution time proportional to file size and hitting API Gateway's payload limit.
Signing a URL is local cryptography with no API call.

**Partial unique index.** "One review per unmodified drink per user" cannot be a
plain unique constraint, because modified drinks are deliberately allowed to
duplicate. A partial index on `(user_id, drink_id) WHERE modified = false`
expresses it exactly.

## 3. Implemented so far

| Capability | Status |
|---|---|
| Cognito sign-up and sign-in | Working |
| JWT enforcement on protected routes | Working |
| Presigned photo upload to S3 | Working |
| Review creation with update-in-place | Working |
| Event-driven thumbnailing and EXIF stripping | Working |
| Cross-location drink rankings | Working |
| Infrastructure as code (SAM) | Working |

## 3a. Interface design

Seventeen screens are designed and in the repository (`docs/screens.html`,
rendered to `docs/Sip-Screens.pdf`): launch, feed, comment threads, map,
location detail, the three Drinks sections (best in area, trending, search),
saved, the three-step review flow, the already-reviewed case, the empty state,
and profile with ranks. None of it is built yet; it defines the target the
client will be written against.

Two design decisions carry product weight. Posting requires a review — there is
no text-only composer anywhere in the app, which makes spam and self-promotion
structurally expensive rather than something to moderate after the fact. And
the leaderboard ranks on a weighted average rather than a raw mean, so a drink
with one five-star review cannot outrank one with two hundred reviews at 4.8.

## 4. Challenges

Four problems during deployment were worth the time they cost, because each one
changed the design rather than just delaying it.

**Lambda in a VPC has no route to the internet.** Our first design called Cognito
from inside the function, which would have required a NAT gateway at roughly
$32/month — outside the free tier and the single largest line item in the
architecture. Moving token validation to the API Gateway JWT authorizer removed
the dependency entirely, and an S3 gateway VPC endpoint carries photo traffic
privately for the same reason. The lesson generalises: in a serverless design,
moving a responsibility to a managed service can delete an entire cost line.

**A circular dependency in the CloudFormation template.** Every function received
the photo bucket's name as an environment variable via `!Ref`, and two referenced
it again in their IAM policies — so all four functions depended on the bucket.
The bucket in turn depended on the thumbnail function, because an S3 event
trigger needs that function's ARN. CloudFormation refused the whole stack. The
fix was to give the bucket a deterministic name built from the account ID and
region, so functions refer to it by name rather than by reference, and to declare
the S3 notification and its Lambda permission explicitly rather than letting SAM
generate them. Dependency direction is part of the design, not an implementation
detail.

**Organisation policy restricted the deployment region.** The AWS account sits
under a service control policy that denies most services in `us-east-1` and
`us-west-2`, permitting them only in the project's selected region. An SCP deny
cannot be overridden by IAM permissions, so the stack was deployed to `us-east-2`
instead. Worth knowing before choosing a region on any managed account.

**The browser could not call the API from a local file.** API Gateway returns no
CORS headers when the request origin is `null`, which is what a page opened from
`file://` sends, and the literal string `null` cannot be allowlisted because the
service validates origin format. The demo client is therefore hosted in S3 as a
static website, which gives it a real origin — and reuses the pattern from the
Module 3 lab.

Connection handling also needed care. Each Lambda container holds its own pool,
so a burst of cold starts can exhaust a db.t4g.micro's connection limit. The pool
is capped at two connections per container.

Finally, the image library was changed from `sharp` to `jimp`. `sharp` compiles
native binaries, which requires a container build and Docker on the developer's
machine; `jimp` is pure JavaScript, so the whole stack builds and deploys from
AWS CloudShell with no local tooling at all. The tradeoff is that `jimp` does not
apply EXIF orientation, so portrait photos can appear rotated in thumbnails.

## 5. Remaining work

- Expo mobile client built against the designed screens
- Google Places integration for hours, photos, and venue details
- Weighted ranking plus a weekly standings snapshot, so leaderboard movement is stable
- Menu import, so drinks are not seeded by hand
- CloudFront in front of the photo bucket for delivery
- Comment threads, saved list, reputation scoring, business accounts

## 6. Risks

| Risk | Mitigation |
|---|---|
| Menu data entry is manual, not a coding problem | Seed a handful of shops; add business-submitted menus later |
| Two-person team with overlapping course deadlines | Scope deliberately narrow; core path already working |
| Free-tier limits on RDS after 12 months | Not a factor within the semester |
| Google Places bills per photo request and forbids caching most fields | Cache `place_id` only; fetch details through Lambda with a short TTL |
