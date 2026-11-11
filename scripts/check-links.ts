import sourcesData from '../src/data/sources.json';
import examsData from '../src/data/examinations/exams.json';

interface LinkCheckResult {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

async function checkUrl(url: string, timeoutMs = 8000): Promise<LinkCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', signal: controller.signal });
    }
    return { url, ok: res.ok || (res.status >= 300 && res.status < 400), status: res.status };
  } catch (err) {
    return { url, ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const urls = Array.from(
    new Set(
      [
        ...sourcesData.sources.map((s) => s.url),
        ...examsData.exams.map((e) => e.officialPortalUrl)
      ].filter((u) => u.startsWith('http://') || u.startsWith('https://'))
    )
  );

  console.log(`Checking ${urls.length} unique reference URLs...`);
  const results: LinkCheckResult[] = [];
  for (const url of urls) {
    const r = await checkUrl(url);
    results.push(r);
    console.log(`  [${r.ok ? 'OK' : 'FAIL'}] ${r.url} (${r.status ?? r.error ?? 'unknown'})`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.warn(`\n${failed.length} external links returned non-2xx/3xx status.`);
    if (process.argv.includes('--strict')) {
      process.exit(1);
    }
  }
}

main();

