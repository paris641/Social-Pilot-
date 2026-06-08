const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const API = 'http://localhost:3001/api';

async function run() {
  try {
    console.log('Creating test client...');
    const clientRes = await fetch(`${API}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Test Client',
        brandName: 'E2E Brand',
        industry: 'Testing',
        contactPerson: 'QA',
        email: 'qa@example.com',
      }),
    });
    const clientJson = await clientRes.json();
    if (!clientJson?.success) throw new Error('Failed to create client: ' + JSON.stringify(clientJson));
    const client = clientJson.data;
    console.log('Client created:', client.id);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Create calendar entries
    console.log('Creating calendar entries...');
    const entries = [
      { clientId: client.id, date: new Date().toISOString(), contentType: 'post', status: 'posted', title: 'Post 1' },
      { clientId: client.id, date: new Date().toISOString(), contentType: 'story', status: 'posted', title: 'Story 1' },
      { clientId: client.id, date: new Date().toISOString(), contentType: 'post', status: 'pending', title: 'Draft 1' },
    ];

    for (const e of entries) {
      const r = await fetch(`${API}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(e),
      });
      const j = await r.json();
      if (!j?.success) throw new Error('Failed to create calendar entry: ' + JSON.stringify(j));
    }
    console.log('Calendar entries created.');

    // Add analytics snapshots
    console.log('Adding analytics snapshots...');
    const snapshots = [];
    for (let i = 6; i >= 0; i--) {
      snapshots.push({ date: new Date(Date.now() - i * 24 * 3600 * 1000).toISOString(), followers: 100 + (6 - i) * 5, engagement: 3 + (i % 3), reach: 1000 + i * 50, platform: 'instagram' });
    }
    const snapR = await fetch(`${API}/analytics/client/${client.id}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshots }),
    });
    console.log('Analytics bulk import response:', await snapR.json());

    // Create report (simulate AI) using POST /reports
    console.log('Creating manual report...');
    const metrics = { postedPosts: 2, postsCount: 1, storiesCount: 1, reelsCount: 0, avgEngagement: 3.5, totalReach: 4350, followerGrowth: 35 };
    const reportR = await fetch(`${API}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, month, year, summary: 'This is a test report summary.', insights: { a: 1 }, metrics }),
    });
    const reportJson = await reportR.json();
    if (!reportJson?.success) throw new Error('Failed to create report: ' + JSON.stringify(reportJson));
    const report = reportJson.data;
    console.log('Report created:', report.id);

    // Fetch reports list
    console.log('Fetching reports for client...');
    const listR = await fetch(`${API}/reports/client/${client.id}`);
    const listJson = await listR.json();
    console.log('Reports list:', listJson.data?.length);

    // Download PDF for the created report
    console.log('Downloading PDF...');
    const pdfRes = await fetch(`${API}/reports/${report.id}/pdf`);
    if (!pdfRes.ok) throw new Error('Failed to download PDF: ' + pdfRes.statusText);
    const buffer = await pdfRes.arrayBuffer();
    const outPath = path.join(process.cwd(), 'storage', 'exports', `report-${report.id}.pdf`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(buffer));
    console.log('PDF saved to', outPath);

    // Check client dashboard
    console.log('Fetching client dashboard...');
    const dash = await fetch(`${API}/clients/${client.id}/dashboard`).then((r) => r.json());
    console.log('Dashboard summary:', dash.data.postsThisMonth);

    console.log('E2E checks completed successfully.');
  } catch (err) {
    console.error('E2E test failed:', err);
    process.exitCode = 1;
  }
}

run();
