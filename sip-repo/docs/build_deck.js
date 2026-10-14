const pptxgen = require('pptxgenjs');
const { applyTheme } = require('/mnt/skills/public/pptx/scripts/apply_theme.js');

const THEME = {
  name: 'Sip',
  headFontFace: 'Georgia',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '1F1D1A', lt1: 'FBFAF7',
    dk2: '4A4438', lt2: 'EFECE5',
    accent1: '4A7C62', accent2: '8C6239', accent3: '6B6558',
    accent4: 'A8503C', accent5: '7FA68A', accent6: 'C9C2B4',
    hlink: '4A7C62', folHlink: '6B6558',
  },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Sip — Midpoint Evaluation';
pres.author = 'Oscar Barrios Jimenez, Evan Willsey';

const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: 'TITLE_SLIDE',
  background: { color: C.text1 },
  objects: [
    { rect: { x: 0, y: 4.62, w: 13.33, h: 0.07, fill: { color: C.accent1 } } },
    {
      placeholder: {
        options: { name: 'title', type: 'title', x: 1.0, y: 2.5, w: 11.3, h: 1.5,
          fontSize: 54, bold: true, color: C.background1, valign: 'bottom', align: 'left' },
        text: '',
      },
    },
    {
      placeholder: {
        options: { name: 'body', type: 'body', x: 1.0, y: 4.95, w: 11.3, h: 1.6,
          fontSize: 16, color: C.accent6, valign: 'top' },
        text: '',
      },
    },
  ],
});

pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: C.background1 },
  objects: [
    { rect: { x: 0.8, y: 1.18, w: 1.2, h: 0.05, fill: { color: C.accent1 } } },
    {
      placeholder: {
        options: { name: 'title', type: 'title', x: 0.8, y: 0.45, w: 11.7, h: 0.65,
          fontSize: 30, bold: true, color: C.text1, valign: 'middle', align: 'left' },
        text: '',
      },
    },
    {
      placeholder: {
        options: { name: 'body', type: 'body', x: 0.8, y: 1.55, w: 11.7, h: 5.2,
          fontSize: 17, color: C.text2, valign: 'top' },
        text: '',
      },
    },
  ],
  slideNumber: { x: 12.6, y: 6.95, fontSize: 11, color: C.accent3 },
});

pres.defineSlideMaster({
  title: 'TITLE_ONLY',
  background: { color: C.background1 },
  objects: [
    { rect: { x: 0.8, y: 1.18, w: 1.2, h: 0.05, fill: { color: C.accent1 } } },
    {
      placeholder: {
        options: { name: 'title', type: 'title', x: 0.8, y: 0.45, w: 11.7, h: 0.65,
          fontSize: 30, bold: true, color: C.text1, valign: 'middle', align: 'left' },
        text: '',
      },
    },
  ],
  slideNumber: { x: 12.6, y: 6.95, fontSize: 11, color: C.accent3 },
});

const bulletsAll = (items) =>
  items.map((t) => ({
    text: t,
    options: { bullet: true, breakLine: true, paraSpaceAfter: 10 },
  }));

const bullets = (items) =>
  items.map((t, i) => ({
    text: t,
    options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 10 },
  }));

// ---------- 1. Title ----------
pres.addSection({ title: 'Overview' });
let s = pres.addSlide({ masterName: 'TITLE_SLIDE', sectionTitle: 'Overview' });
s.addText('Sip', { placeholder: 'title' });
s.addText(
  [
    { text: 'Drink-level reviews for coffee, tea, and matcha', options: { breakLine: true, fontSize: 20, color: THEME.colors.lt1 } },
    { text: 'Midpoint Evaluation  ·  CSE 4333/5333 Cloud Computing', options: { breakLine: true } },
    { text: 'Oscar Barrios Jimenez (oxb3281)  ·  Evan Willsey (exw1419)', options: {} },
  ],
  { placeholder: 'body' }
);
s.addNotes('Thirty seconds. Name the project, name the team, move on.');

// ---------- 2. Problem ----------
s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Overview' });
s.addText('The problem, and what we built instead', { placeholder: 'title' });
s.addText(
  bullets([
    'Yelp and Google rate the coffee shop — a blend of ambiance, seating, Wi-Fi, and service. Drink quality is buried inside a single star score.',
    'A four-star shop tells you nothing about whether its oat milk latte is good.',
    'Sip rates the drink. Search "Oat Milk Latte" and see every version across the metro, ranked on drink quality alone.',
    'Reviews attach to a preloaded menu item, not free text. That constraint is what makes cross-location aggregation possible — and what incumbents cannot retrofit onto millions of free-text reviews.',
  ]),
  { placeholder: 'body' }
);
s.addNotes('One minute. The last bullet is the defensible part — lead with it if asked about competitors.');

// ---------- 3. Architecture ----------
pres.addSection({ title: 'Architecture' });
s = pres.addSlide({ masterName: 'TITLE_ONLY', sectionTitle: 'Architecture' });
s.addText('Current architecture', { placeholder: 'title' });

const box = (x, y, w, h, label, sub, fill, textColor) => {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: fill },
    line: { color: THEME.colors.dk2, width: 0.5 },
    objectName: label,
  });
  s.addText(
    [
      { text: label, options: { bold: true, fontSize: 13, breakLine: true, color: textColor } },
      { text: sub, options: { fontSize: 10, color: textColor } },
    ],
    { x, y, w, h, align: 'center', valign: 'middle', margin: 2, isTextBox: true }
  );
};

const arrow = (x, y, w, h, flipH) => {
  s.addShape(pres.ShapeType.line, {
    x, y, w, h,
    line: { color: THEME.colors.dk2, width: 1.25, endArrowType: 'triangle' },
    flipH: Boolean(flipH),
  });
};

// VPC container
s.addShape(pres.ShapeType.rect, {
  x: 0.75, y: 4.0, w: 11.8, h: 2.55,
  fill: { color: THEME.colors.lt2 },
  line: { color: THEME.colors.accent1, width: 1, dashType: 'dash' },
  objectName: 'VPC boundary',
});
s.addText('VPC  ·  private subnets, two availability zones  ·  no NAT gateway', {
  x: 0.9, y: 4.08, w: 7, h: 0.3, fontSize: 11, italic: true,
  color: THEME.colors.accent1, isTextBox: true, margin: 0,
});

box(0.9, 1.5, 2.3, 0.85, 'Client', 'Browser / Expo', THEME.colors.lt1, THEME.colors.dk1);
box(4.1, 1.5, 2.5, 0.85, 'Amazon Cognito', 'User pool, issues JWT', THEME.colors.lt1, THEME.colors.dk1);
box(7.5, 1.5, 3.0, 0.85, 'API Gateway (HTTP)', 'JWT validated at the edge', THEME.colors.accent1, THEME.colors.lt1);

arrow(3.2, 1.93, 0.9, 0);
arrow(6.6, 1.93, 0.9, 0);

box(0.9, 2.9, 2.3, 0.8, 'S3: photos', 'originals/ and thumbs/', THEME.colors.accent2, THEME.colors.lt1);

// Client PUTs the photo straight to S3 with a presigned URL.
arrow(2.05, 2.35, 0, 0.55);
s.addText('presigned PUT', {
  x: 2.2, y: 2.42, w: 2.2, h: 0.3, fontSize: 10, italic: true,
  color: THEME.colors.accent3, isTextBox: true, margin: 0,
});

// API Gateway fans out to the three request-driven functions.
arrow(9.0, 2.35, 0, 1.85);
s.addShape(pres.ShapeType.line, {
  x: 5.1, y: 4.2, w: 5.6, h: 0,
  line: { color: THEME.colors.dk2, width: 1.25 },
});
arrow(5.1, 4.2, 0, 0.3);
arrow(7.9, 4.2, 0, 0.3);
arrow(10.7, 4.2, 0, 0.3);

box(1.1, 4.5, 1.9, 0.95, 'processPhoto', 'Lambda, S3-triggered', THEME.colors.accent5, THEME.colors.dk1);
box(4.15, 4.5, 1.9, 0.95, 'presignUpload', 'Lambda', THEME.colors.lt1, THEME.colors.dk1);
box(6.95, 4.5, 1.9, 0.95, 'createReview', 'Lambda, in VPC', THEME.colors.lt1, THEME.colors.dk1);
box(9.75, 4.5, 1.9, 0.95, 'listRankings', 'Lambda, in VPC', THEME.colors.lt1, THEME.colors.dk1);

// S3 object-created event triggers thumbnailing.
arrow(2.05, 3.7, 0, 0.8);
s.addText('s3:ObjectCreated', {
  x: 2.2, y: 3.70, w: 2.2, h: 0.3, fontSize: 10, italic: true,
  color: THEME.colors.accent3, isTextBox: true, margin: 0,
});

box(5.6, 5.95, 5.4, 0.6, 'RDS PostgreSQL', 'private, encrypted at rest', THEME.colors.dk2, THEME.colors.lt1);

arrow(7.9, 5.45, 0, 0.5);
arrow(10.7, 5.45, 0, 0.5);
s.addShape(pres.ShapeType.line, {
  x: 2.05, y: 5.45, w: 0, h: 0.8,
  line: { color: THEME.colors.dk2, width: 1.25 },
});
arrow(2.05, 6.25, 3.55, 0);

s.addNotes(
  'Ninety seconds. Three design decisions worth naming: photos bypass Lambda via presigned URLs; ' +
  'the Cognito authorizer validates JWTs before our code runs; an S3 gateway endpoint carries photo ' +
  'traffic privately. Together those are why there is no NAT gateway, which would have cost about ' +
  'thirty-two dollars a month outside the free tier.'
);

// ---------- 4. Services ----------
s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Architecture' });
s.addText('Services in use, and why', { placeholder: 'title' });
s.addTable(
  [
    [
      { text: 'Service', options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.dk2 } } },
      { text: 'Role in Sip', options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.dk2 } } },
    ],
    ['Cognito', 'Email sign-in; issues the JWT every API call carries'],
    ['API Gateway (HTTP API)', 'Routing plus JWT validation before any function runs'],
    ['Lambda ×4', 'Presign, create review, rank drinks, process photo'],
    ['S3', 'Review photos; object-created events drive thumbnailing'],
    ['RDS PostgreSQL', 'Reviews, drinks, locations, and the aggregation query'],
    ['VPC + security groups', 'Database reachable only from the Lambda security group'],
    ['CloudFormation / SAM', 'Whole stack defined in one template, deployed by one command'],
  ],
  {
    x: 0.8, y: 1.6, w: 11.7, colW: [3.2, 8.5],
    fontSize: 14, border: { type: 'solid', color: THEME.colors.accent6, pt: 0.5 },
    rowH: 0.42, valign: 'middle',
  }
);
s.addNotes('Forty-five seconds. Do not read the table — point at it and name the two or three you want credit for.');

// ---------- 5. DevOps ----------
s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Architecture' });
s.addText('Infrastructure as code', { placeholder: 'title' });
s.addText(
  bullets([
    'The entire stack — VPC, subnets, security groups, RDS, S3, Cognito, API Gateway, and four Lambdas — lives in one SAM template under version control.',
    'sam build && sam deploy rebuilds the environment from scratch. We tore ours down and redeployed it twice while developing.',
    'Secrets are deploy-time parameters, never committed. The repo ships .env.example; .env is gitignored.',
    'Database schema is a checked-in SQL file, so the structure is reviewable in a pull request rather than clicked into a console.',
  ]),
  { placeholder: 'body' }
);
s.addNotes('Thirty seconds. "Reproducible from one command" is the line that matters here.');

// ---------- 6. Progress ----------
pres.addSection({ title: 'Progress' });
s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Progress' });
s.addText('What works today', { placeholder: 'title' });
s.addText(
  bullets([
    'Sign-up and sign-in through Cognito, with API calls rejected without a valid token.',
    'Photo upload straight to S3 through a presigned URL, expiring in five minutes.',
    'Review creation, including the one-review-per-drink constraint — posting twice updates the first review rather than creating a duplicate.',
    'Event-driven processing: an upload triggers a Lambda that strips EXIF data, builds a thumbnail, and writes it back to the review row.',
    'The core feature end to end — one drink name, every location serving it, ranked by average rating.',
  ]),
  { placeholder: 'body' }
);
s.addNotes('One minute. This is the technical-progress slide; the demo backs it up, so keep it brisk.');


// ---------- Product design ----------
s = pres.addSlide({ masterName: 'TITLE_ONLY', sectionTitle: 'Progress' });
s.addText('What it will look like', { placeholder: 'title' });
s.addText('Interface design \u2014 not yet built. The working prototype demonstrated today is the API and data layer.', {
  x: 0.8, y: 1.22, w: 11.7, h: 0.3, fontSize: 13, italic: true,
  color: THEME.colors.accent3, isTextBox: true, margin: 0,
});
{
  const shots = [
    ['screens/screen-02.png', 'Feed'],
    ['screens/screen-08.png', 'Best in area'],
    ['screens/screen-06.png', 'Location detail'],
  ];
  const h = 4.75, w = h * 640 / 1322, gap = 0.5;
  let x = (13.33 - (shots.length * w + (shots.length - 1) * gap)) / 2;
  for (const [file, cap] of shots) {
    s.addImage({ path: __dirname + '/' + file, x, y: 1.75, w, h, objectName: cap });
    s.addText(cap, {
      x, y: 1.75 + h + 0.08, w, h: 0.3, fontSize: 12, align: 'center',
      color: THEME.colors.dk2, isTextBox: true, margin: 0,
    });
    x += w + gap;
  }
}
s.addNotes('Thirty seconds. Say plainly that this is design, not running code, then move on \u2014 the demo is where progress gets proven.');

// ---------- 7. Challenges ----------
s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Progress' });
s.addText('What was harder than expected', { placeholder: 'title' });
s.addText(
  bullets([
    'A Lambda inside a VPC has no route to the internet. Our first design called Cognito from inside the function, which meant a NAT gateway at about $32/month. Moving validation to the API Gateway authorizer removed the dependency entirely.',
    'CloudFormation refused the stack over a circular dependency: every function referenced the photo bucket, while the bucket referenced the thumbnail function for its event trigger. Fixed by naming the bucket deterministically and declaring the S3 notification explicitly.',
    'An organisation policy denies most services in us-east-1, so the stack runs in us-east-2. A service control policy cannot be overridden by IAM permissions.',
    'Expressing "one review per unmodified drink" took a partial unique index rather than a plain constraint, since modified drinks are deliberately allowed to duplicate.',
  ]),
  { placeholder: 'body' }
);
s.addNotes('Forty-five seconds. The NAT story and the circular dependency are the two worth telling — one is a cost decision, the other shows you understand how CloudFormation orders resources.');

// ---------- 8. Remaining ----------
pres.addSection({ title: 'Next steps' });
s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Next steps' });
s.addText('Remaining work, risks, and the plan', { placeholder: 'title' });
s.addText(
  [
    { text: 'To build', options: { bold: true, breakLine: true, color: THEME.colors.accent1, paraSpaceAfter: 4 } },
    ...bulletsAll([
      'Expo client replacing the demo page',
      'Menu import so drinks are not seeded by hand',
      'CloudFront in front of the photo bucket',
    ]),
    { text: '', options: { breakLine: true } },
    { text: 'Risks', options: { bold: true, breakLine: true, color: THEME.colors.accent4, paraSpaceAfter: 4 } },
    ...bulletsAll([
      'Menu data entry is manual work, not a coding problem — mitigated by seeding a handful of shops rather than all of DFW',
      'Two-person team with overlapping deadlines; scope is deliberately narrow',
    ]),
  ],
  { placeholder: 'body' }
);
s.addNotes('Forty-five seconds. Naming the menu-entry problem before anyone asks reads as planning, not as a gap.');

(async () => {
  await pres.writeFile({ fileName: __dirname + '/GroupNN-Sip.pptx' });
  await applyTheme(__dirname + '/GroupNN-Sip.pptx', THEME);
  console.log('deck written');
})();
