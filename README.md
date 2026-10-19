# Sip — drink-level reviews for coffee, tea, and matcha

VIDEO LINK TO OUR DEMO: https://www.icloud.com/photos/#/icloudlinks/082VIUqYAR7tXZy6a8-C7lIIQ/

Video Timestamped on 10/14/2026
Our current progress is shown on this video link. Currently we have the ability to sign in with a unique token for a user,
then the ability to post a drink review; in this case, a Matcha Latte, that said drink is then 
populated to the drinks database, where we can see all the locations that currently have that drink and its rating.

Yelp and Google rate the coffee shop. Sip rates the drink.

A four-star venue score blends ambiance, seating, Wi-Fi and service, and tells
you nothing about whether their oat milk latte is any good. Sip aggregates
ratings per drink per location, so you can search one drink name and see every
version across the metro ranked on drink quality alone.

Reviews attach to a menu item at a specific shop rather than to free text. That
constraint is what makes cross-location aggregation possible — and it is why
platforms sitting on millions of free-text reviews cannot add this feature after
the fact.

**CSE 4333/5333 Cloud Computing · UT Arlington**
Oscar Barrios Jimenez (oxb3281) · Evan Willsey (exw1419)

---

### Status — midpoint

The backend is deployed and working on AWS. Sign-in, photo upload, review
creation, event-driven thumbnailing and cross-location ranking all run against
live infrastructure. The mobile client is designed but not yet built.

| | |
|---|---|
| **Stack** | Cognito · API Gateway · Lambda ×4 · S3 · RDS PostgreSQL · VPC |
| **Defined by** | One AWS SAM template, deployed with one command |
| **Region** | `us-east-2` |

---

### Where to look

| | |
|---|---|
| [`sip-repo/README.md`](sip-repo/README.md) | Full documentation — architecture, design decisions, deploy steps |
| [`sip-repo/infrastructure/template.yaml`](sip-repo/infrastructure/template.yaml) | The entire stack as code |
| [`sip-repo/backend/src/handlers/`](sip-repo/backend/src/handlers/) | The four Lambda functions |
| [`sip-repo/docs/MIDPOINT_REPORT.md`](sip-repo/docs/MIDPOINT_REPORT.md) | Midpoint report |
| [`sip-repo/docs/Sip-Screens.pdf`](sip-repo/docs/Sip-Screens.pdf) | Interface designs — 17 screens |

---

### One design decision worth the click

A Lambda inside a VPC has no route to the internet, and adding one costs about
$32/month. Moving JWT validation to the API Gateway authorizer and adding an S3
gateway endpoint removed the need for a NAT gateway entirely — the functions
never have to reach out, so nothing has to let them.

The full reasoning, and three other problems that changed the design, are in
[the main README](sip-repo/README.md).
