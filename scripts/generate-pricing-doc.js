// Run: node scripts/generate-pricing-doc.js
// Output: docs/pricing-strategy.docx

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Colours ────────────────────────────────────────────────────────────────────
const BLUE_HDR  = 'D5E8F0';  // table header row fill
const GREY_ALT  = 'F5F5F5';  // alternating row fill
const ACCENT    = '2563EB';  // heading accent (dark blue)

// ── Layout constants (DXA — 1440 DXA = 1 inch) ────────────────────────────────
const PAGE_W        = 12240;
const PAGE_H        = 15840;
const MARGIN        = 1440;  // 1 inch
const CONTENT_W     = PAGE_W - MARGIN * 2;  // 9360

// ── Helpers ────────────────────────────────────────────────────────────────────

function cell(text, { width, isHeader = false, shade = null, bold = false, align = AlignmentType.LEFT } = {}) {
  const fill = isHeader ? BLUE_HDR : shade ?? 'FFFFFF';
  return new TableCell({
    width:   { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left:   { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right:  { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({
          text,
          bold: bold || isHeader,
          size: isHeader ? 20 : 20,
          font: 'Arial',
          color: isHeader ? '1E3A5F' : '1F2937',
        })],
      }),
    ],
  });
}

function tableRow(cells, isHeader = false, isAlt = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map((c, i) =>
      cell(c.text, {
        width:    c.width,
        isHeader,
        shade:    !isHeader && isAlt ? GREY_ALT : null,
        bold:     c.bold ?? false,
        align:    c.align ?? AlignmentType.LEFT,
      })
    ),
  });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = tableRow(
    headers.map((h, i) => ({ text: h, width: colWidths[i] })),
    true
  );
  const dataRows = rows.map((row, ri) =>
    tableRow(
      row.map((text, ci) => ({ text, width: colWidths[ci] })),
      false,
      ri % 2 === 1
    )
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 36, font: 'Arial', color: ACCENT })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Arial', color: '1E3A5F' })],
  });
}

function body(text, { bold = false, italic = false, spacing = 160 } = {}) {
  return new Paragraph({
    spacing: { after: spacing },
    children: [new TextRun({ text, bold, italic, size: 24, font: 'Arial', color: '1F2937' })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360, hanging: 240 },
    children: [
      new TextRun({ text: '•  ', bold: true, size: 24, font: 'Arial', color: ACCENT }),
      new TextRun({ text, size: 24, font: 'Arial', color: '1F2937' }),
    ],
  });
}

function space(pts = 120) {
  return new Paragraph({ spacing: { after: pts }, children: [new TextRun('')] });
}

function rule() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB', space: 1 } },
    children: [new TextRun('')],
  });
}

// ── Document content ────────────────────────────────────────────────────────────

const children = [];

// ── 1. COVER PAGE ──────────────────────────────────────────────────────────────

children.push(
  space(1440),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'NetWorthy', bold: true, size: 72, font: 'Arial', color: ACCENT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Play Store Pricing & Monetization Strategy', size: 32, font: 'Arial', color: '4B5563', italic: true })],
  }),
  rule(),
  space(240),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Prepared by: Wendell Villareal', size: 22, font: 'Arial', color: '6B7280' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'June 2026', size: 22, font: 'Arial', color: '6B7280' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Version 1.0  —  Confidential', size: 22, font: 'Arial', color: '6B7280' })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ── 2. EXECUTIVE SUMMARY ───────────────────────────────────────────────────────

children.push(
  h1('1. Executive Summary'),
  body(
    'NetWorthy is a full-featured personal finance management app for Android, built for Filipino ' +
    'individuals and young professionals who want a single place to track their spending, set budgets, ' +
    'build savings goals, monitor investments, and understand their overall financial health. The app ' +
    'syncs all data to the cloud in real time, runs offline, and includes bank-level security features ' +
    'including biometric authentication, PIN protection, and screenshot prevention.'
  ),
  body(
    'This document outlines the recommended monetization approach for the Google Play Store launch: ' +
    'a freemium model with a one-time Pro unlock. Free users can access the app’s core differentiators ' +
    '— unlimited transactions, net worth tracking, and the Financial Health Score — without restriction. ' +
    'Pro users unlock advanced analytics, financial forecasting, data export, and unlimited scale ' +
    '(goals, budgets, investment accounts). The recommended launch price is ₱249, rising to ₱399 ' +
    'after the initial 90-day period.'
  ),
  space(),
);

// ── 3. APP OVERVIEW ────────────────────────────────────────────────────────────

children.push(
  h1('2. App Overview'),
  makeTable(
    ['Attribute', 'Detail'],
    [
      ['Platform',         'Android (Google Play Store)'],
      ['Framework',        'React Native / Expo SDK 54'],
      ['Backend',          'Supabase (Postgres, Auth, Storage, Real-time)'],
      ['Default Currency', 'Philippine Peso (PHP) — supports 10 currencies'],
      ['Target Users',     'Filipino individuals and young professionals, ages 20–40'],
      ['Core Value Prop',  'All-in-one finance tracker: spending, budgets, investments, net worth, health score'],
      ['Security',         'PIN, biometrics, auto-lock, screenshot prevention, Supabase RLS'],
      ['Offline Support',  'Offline-first with React Query cache; syncs when connection resumes'],
    ],
    [3120, 6240]
  ),
  space(),
);

// ── 4. FEATURE INVENTORY ───────────────────────────────────────────────────────

children.push(h1('3. Full Feature Inventory'));

// 3.1 Dashboard & Health Score
children.push(
  h2('3.1 Dashboard & Financial Health Score'),
  makeTable(
    ['Feature', 'Description'],
    [
      ['Personalized Dashboard',    'Good morning/afternoon/evening greeting, key stats at a glance'],
      ['Financial Health Score',    'Composite 0–100 score across 4 factors: savings rate, emergency fund, debt ratio, goal progress'],
      ['5 Score Modes',             'Balanced, Foundation Builder, Wealth Builder, Debt Freedom, Goal Focused — user-selectable'],
      ['Score Bands',               'Needs Attention (<40), Fair (40–60), Good (60–80), Excellent (80+)'],
      ['Net Worth Summary',         'Total assets minus total debts displayed prominently on the home screen'],
      ['Milestone Celebrations',    'Animated events at ₱100K, ₱500K, ₱1M, ₱5M, ₱10M net worth'],
      ['Quick Stats',               'Monthly income, expenses, net change, savings rate'],
      ['Budget Overview',           'Compact budget status per category with colour-coded alerts'],
    ],
    [3120, 6240]
  ),
  space(),
);

// 3.2 Transactions
children.push(
  h2('3.2 Transactions'),
  makeTable(
    ['Feature', 'Description'],
    [
      ['Expense Logging',         '9 categories: Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other'],
      ['Income Recording',        '3 income types: Salary, Freelance, Other Income'],
      ['Transfers',               'Move money between tracked accounts; not counted as income or expense'],
      ['Transaction History',     'Grouped by date (Today, Yesterday, named dates), searchable, filterable'],
      ['Advanced Filters',        'Filter by period (week/month/year), type, category, amount range, account'],
      ['Full Edit / Delete',      'Edit merchant, amount, date, category, notes on any transaction'],
      ['Search',                  'Full-text search across merchant name, category, and notes'],
      ['Budget Alert on Entry',   'Real-time alert when adding an expense that crosses 80% or 100% of budget'],
    ],
    [3120, 6240]
  ),
  space(),
);

// 3.3 Budgets
children.push(
  h2('3.3 Budgets'),
  makeTable(
    ['Feature', 'Description'],
    [
      ['Per-Category Budget Limits',  'Set monthly spending limits for each expense category'],
      ['Donut Chart Overview',        'Visual breakdown of spending vs. limits across all categories'],
      ['Progress Tracking',           'Live spent vs. limit with on track / warning / exceeded status'],
      ['80% and 100% Alerts',         'Push notifications when spending reaches configured thresholds'],
      ['Per-Category Alert Toggles',  'Enable or disable budget alerts independently for each category'],
      ['Monthly Budget History',      'View budget performance month by month over time'],
      ['Setup Wizard',                'Step-by-step guided setup for first-time budget creation'],
      ['Budget Detail Screen',        'Drill into a category to see all transactions against that budget'],
    ],
    [3120, 6240]
  ),
  space(),
);

// 3.4 Wealth
children.push(
  h2('3.4 Wealth (Net Worth, Savings Goals, Investments)'),
  makeTable(
    ['Feature', 'Description'],
    [
      ['Net Worth Calculation',     'Total assets (bank accounts, investments, property, vehicles) minus total debts'],
      ['Asset Account Tracking',    'Bank accounts, real estate, vehicles, cash — with balance history'],
      ['Debt Account Tracking',     'Credit cards, mortgages, auto loans, student loans with interest rates and payoff tracking'],
      ['Savings Goals',             'Named goals with emoji, target amount, colour, and contribution history'],
      ['Goal Progress Tracking',    'Circular progress indicator, contribution log, goal completion celebration'],
      ['Investment Portfolio',      'Track stocks, ETFs, mutual funds, bonds, and crypto with P&L calculations'],
      ['Investment Transactions',   'Log buy/sell/dividend events per holding'],
      ['Portfolio Allocation',      'Visual breakdown of asset type composition (stocks, ETFs, bonds, crypto, etc.)'],
      ['Debt Payoff Timeline',      'Estimated months to payoff per debt based on balance, interest rate, and payment'],
      ['6/12/24-month NW Chart',    'Animated line chart of net worth history with smart Y-axis ticks'],
    ],
    [3120, 6240]
  ),
  space(),
);

// 3.5 Analytics
children.push(
  h2('3.5 Analytics & Forecasting'),
  makeTable(
    ['Feature', 'Description'],
    [
      ['Spending Trends Chart',     'Weekly, monthly, or yearly spending history as a smooth animated line chart'],
      ['Income Analysis Chart',     'Income over time across all sources; period comparison with delta indicators'],
      ['Net Worth Growth Chart',    'Historical net worth trajectory with nice rounded Y-axis ticks'],
      ['Category Breakdown',        'Top expense categories with percentage share and colour-coded bars'],
      ['Period Comparisons',        'Current vs. previous period delta for spending, income, and savings rate'],
      ['Financial Forecast',        'Compound interest projections, goal completion dates, debt payoff timelines'],
      ['Debt Payoff Projections',   'Per-debt estimated months to payoff based on interest rate and payment'],
      ['Cash Flow Analysis',        'Monthly income vs. expenses vs. net savings over time'],
    ],
    [3120, 6240]
  ),
  space(),
);

// 3.6 Security
children.push(
  h2('3.6 Security & Privacy'),
  makeTable(
    ['Feature', 'Description'],
    [
      ['PIN Protection',           '4+ digit PIN hashed with SHA-256, stored in OS Keychain via Expo SecureStore'],
      ['Biometric Authentication', 'Face ID / Touch ID native unlock (Android fingerprint / face recognition)'],
      ['Auto-Lock',                'Configurable inactivity lock: 1 minute, 5 minutes, 15 minutes, or never'],
      ['Screenshot Prevention',    'FLAG_SECURE on Android prevents screenshots; iOS snapshot prevention enabled'],
      ['Brute-Force Lockout',      '5 failed login attempts triggers a 5-minute cooldown timer'],
      ['Cloud Row-Level Security', 'Supabase RLS: every database row is scoped to the authenticated user’s UID'],
      ['Soft Deletes',             'Deleted data is flagged, not removed — recoverable and auditable'],
      ['Change Password',          'In-app password change with strength indicator and friendly error messages'],
    ],
    [3120, 6240]
  ),
  space(),
);

// 3.7 Cloud & Platform
children.push(
  h2('3.7 Cloud, Platform & Utilities'),
  makeTable(
    ['Feature', 'Description'],
    [
      ['Real-Time Cloud Sync',     'All data syncs to Supabase Postgres in real time across devices'],
      ['Offline-First',            'React Query offline cache ensures the app works without connectivity'],
      ['Push Notifications',       'Budget threshold alerts via Expo Push Notification Service'],
      ['Data Export',              'Export all financial data as CSV (spreadsheet), PDF (printable), or JSON (raw)'],
      ['Avatar Upload',            'Profile photo via Expo ImagePicker, stored in Supabase Storage'],
      ['10-Currency Support',      'PHP, USD, EUR, GBP, JPY, SGD, AUD, CAD, INR, KRW — all formatting reactive'],
      ['Dark / Light / Auto Theme','System-aware theme with manual override'],
      ['Haptic Feedback',          'Subtle vibration on key interactions (iOS / Android)'],
      ['10+ Years of History',     'No arbitrary data caps — all historical transactions retained in cloud'],
    ],
    [3120, 6240]
  ),
  space(),
);

// ── 5. PRICING MODEL ───────────────────────────────────────────────────────────

children.push(
  h1('4. Proposed Pricing Model'),
  h2('4.1 Recommendation: Freemium + One-Time Pro Unlock'),
  body(
    'The recommended model for launch is freemium with a single one-time in-app purchase to unlock Pro. ' +
    'This provides the lowest barrier to install while ensuring free users can experience NetWorthy’s ' +
    'strongest differentiators before being asked to pay. It avoids the subscription fatigue that is ' +
    'common with personal finance apps and is well-suited to a first-launch app with no existing user base or reviews.'
  ),
  body('Three core principles guide the tier design:'),
  bullet('Security is never paywalled — PIN, biometrics, auto-lock, and screenshot prevention are free for everyone. Paywalling security features erodes trust, which is especially damaging for a finance app.'),
  bullet('Core habit-forming features stay free — unlimited transactions, net worth, and the health score are what make NetWorthy distinct. Users must see and use these before being asked to upgrade.'),
  bullet('Pro unlocks power and scale — advanced forecasting, analytics, data export, and the ability to grow beyond starter limits (3 budgets, 3 goals, 1 investment account).'),
  space(),
);

// Free tier table
children.push(
  h2('4.2 Free Tier'),
  makeTable(
    ['Feature', 'Free Access'],
    [
      ['Transactions',                              'Unlimited'],
      ['Net Worth tracking (assets + debts)',        '✓ Full access'],
      ['Financial Health Score',                    '✓ Full access (all 5 modes)'],
      ['Analytics — basic (spending trends, income chart)', '✓ Basic access'],
      ['Investment portfolio',                      '✓ 1 portfolio account'],
      ['Budget categories',                         'Up to 3'],
      ['Savings goals',                             'Up to 3'],
      ['Push notifications & budget alerts',        '✓'],
      ['PIN, biometrics, auto-lock, screenshot lock', '✓ Full access'],
      ['Cloud sync',                                '✓'],
      ['Dark / light theme',                        '✓'],
      ['Milestone celebrations',                    '✓'],
    ],
    [5616, 3744]
  ),
  space(),
);

// Pro tier table
children.push(
  h2('4.3 Pro Tier (One-Time Purchase)'),
  makeTable(
    ['Feature', 'Pro Access'],
    [
      ['Everything in Free',                                            '✓ Included'],
      ['Unlimited budget categories',                                  '✓'],
      ['Unlimited savings goals',                                      '✓'],
      ['Unlimited investment accounts',                                '✓'],
      ['Advanced analytics (net worth growth, income analysis)',       '✓'],
      ['Financial Forecasting (debt payoff, goal dates, compound interest)', '✓'],
      ['Data export (CSV / PDF / JSON)',                               '✓'],
      ['Premium insights (coming soon)',                               '✓'],
    ],
    [5616, 3744]
  ),
  space(),
);

// Pricing table
children.push(
  h2('4.4 Suggested Pricing'),
  makeTable(
    ['Market', 'Launch Price (first 90 days)', 'Regular Price'],
    [
      ['Philippines',    '₱249',  '₱399'],
      ['USD equivalent', '~$4.50', '~$7.00'],
    ],
    [3120, 3120, 3120]
  ),
  space(),
  body(
    'Local PH currency pricing is strongly recommended. Google Play auto-converts from USD, but ' +
    'users respond significantly better to prices shown in their native currency. ₱249 maps to ' +
    'approximately one Grab ride or two coffee shop visits — a relatable anchor for the target demographic.'
  ),
  space(),
);

// ── 6. COMPETITIVE POSITIONING ─────────────────────────────────────────────────

children.push(
  h1('5. Competitive Positioning (Illustrative)'),
  body(
    'The table below illustrates how NetWorthy compares to commonly used personal finance apps ' +
    'available on the Google Play Store. Feature tiers are based on publicly known information at time ' +
    'of writing and should be verified before sharing externally.'
  ),
  makeTable(
    ['Feature', 'NetWorthy (Pro)', 'Spendee', 'Money Manager', 'Wallet by BudgetBakers'],
    [
      ['Transaction tracking',        '✓ Unlimited', '✓ Unlimited', '✓ Unlimited', '✓ Unlimited'],
      ['Budget management',           '✓',           '✓',           '✓',           '✓'],
      ['Investment portfolio',        '✓',           '✔ No',         '✓ Basic',     '✔ No'],
      ['Net worth tracking',          '✓',           '✓ Premium',    '✓',           '✓ Premium'],
      ['Financial health score',      '✓',           '✔ No',         '✔ No',        '✔ No'],
      ['Milestone celebrations',      '✓',           '✔ No',         '✔ No',        '✔ No'],
      ['Biometric + PIN lock',        '✓ Free',      'Varies',           '✓',           '✓ Premium'],
      ['Data export',                 '✓ Pro',       '✓ Premium',    '✓',           '✓ Premium'],
      ['PH local pricing (one-time)', '₱249–₱399', 'Subscription ~₱450/mo', 'Free / Ads', 'Subscription ~₱350/mo'],
    ],
    [2340, 1764, 1764, 1764, 1728]
  ),
  space(),
  body(
    'NetWorthy’s primary differentiator is the combination of investment portfolio tracking, net worth ' +
    'milestones, and a Financial Health Score at a one-time price point. Competing apps that offer ' +
    'comparable depth typically require monthly or annual subscriptions.'
  ),
  space(),
);

// ── 7. ALTERNATIVE MODELS ──────────────────────────────────────────────────────

children.push(
  h1('6. Alternative Models Considered'),
  makeTable(
    ['Model', 'Description', 'Why Not at Launch'],
    [
      ['Monthly Subscription',  '₱99/mo or ₱699/yr recurring charge',     'Hard to justify without retention data and existing reviews; high churn risk for first-time app'],
      ['Paid Upfront',          '₱199 one-time purchase before install',        'Low discoverability on Play Store; users cannot experience the app before paying'],
      ['Free Forever',          '100% free, no Pro tier',                         'No revenue path; difficult to introduce monetization later without user backlash'],
      ['Ads-Supported',         'Banner/interstitial ads for free users',          'Inappropriate UX for a financial data app; damages trust and perceived quality'],
    ],
    [2340, 3120, 3900]
  ),
  space(),
  body(
    'The one-time Pro unlock is the recommended approach for the launch phase. Once the app reaches ' +
    '500–1,000 monthly active users (MAU), conversion rate and retention data will indicate whether ' +
    'migrating to an annual subscription model is viable. A hybrid approach — keeping the lifetime ' +
    'option while introducing an annual plan — is also common among apps that successfully scaled ' +
    'from a freemium base.'
  ),
  space(),
);

// ── 8. LAUNCH RECOMMENDATIONS ─────────────────────────────────────────────────

children.push(
  h1('7. Launch Recommendations'),
  bullet('Price in Philippine Peso. Google auto-converts from USD, but local pricing outperforms converted pricing in conversion rate studies for Southeast Asian markets.'),
  bullet('Launch at ₱249 for the first 90 days. This creates urgency for early adopters and helps accumulate initial reviews, which are critical for Play Store discoverability.'),
  bullet('Surface limits gently inside the app. Show a soft notice when users are close to a Free tier limit (e.g., “You have 1 budget slot remaining on Free”) rather than a hard block with no context.'),
  bullet('A/B test ₱249 vs. ₱349 after 500 installs using the Play Store Pricing Experiments feature. A higher price with the same conversion rate means significantly more revenue.'),
  bullet('Track conversion rate and retention at 30 / 60 / 90 days post-launch. A conversion rate above 5% suggests demand for a premium subscription tier; below 2% suggests the paywall is too early or limits are too tight.'),
  bullet('Review at 1,000 MAU. At that milestone, evaluate: (a) raise price to ₱499 if demand is strong, (b) introduce an optional annual subscription alongside the lifetime option, (c) lower Free tier limits if conversion is below target.'),
  space(),
);

// ── Footer helper ──────────────────────────────────────────────────────────────

const footerText = (left, right) => new Paragraph({
  alignment: AlignmentType.LEFT,
  children: [
    new TextRun({ text: left, size: 16, font: 'Arial', color: '9CA3AF' }),
    new TextRun({ text: '\t', size: 16 }),
    new TextRun({ text: right, size: 16, font: 'Arial', color: '9CA3AF' }),
  ],
  tabStops: [{ type: 'right', position: CONTENT_W }],
});

// ── Build document ─────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 24, color: '1F2937' } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run:       { size: 36, bold: true, font: 'Arial', color: ACCENT },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run:       { size: 28, bold: true, font: 'Arial', color: '1E3A5F' },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size:   { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB', space: 1 } },
              children: [new TextRun({ text: 'NetWorthy  —  Pricing Strategy', size: 16, font: 'Arial', color: '9CA3AF' })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB', space: 1 } },
              children: [
                new TextRun({ text: 'NetWorthy · Pricing Strategy · Confidential · June 2026', size: 16, font: 'Arial', color: '9CA3AF' }),
                new TextRun({ text: '\t', size: 16 }),
                new TextRun({ text: 'Page ', size: 16, font: 'Arial', color: '9CA3AF' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: '9CA3AF' }),
              ],
              tabStops: [{ type: 'right', position: CONTENT_W }],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

// ── Write file ─────────────────────────────────────────────────────────────────

const outDir  = path.join(__dirname, '..', 'docs');
const outPath = path.join(outDir, 'pricing-strategy.docx');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log(`✅  Written to ${outPath}`);
}).catch(err => {
  console.error('❌  Error generating document:', err.message);
  process.exit(1);
});
