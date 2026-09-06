async function checkSheet() {
  try {
    const url = 'https://docs.google.com/spreadsheets/d/1W-lf4O16MWs9zeBwBblBB8jo2xEfxHbnwmTRPPtut2I/export?format=csv&gid=692419783';
    const res = await fetch(url, { redirect: 'follow' });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers.get('content-type'));
    const text = await res.text();
    console.log('Content preview:\n', text.substring(0, 500));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
checkSheet();
