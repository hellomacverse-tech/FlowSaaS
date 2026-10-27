import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    burst: {
      executor: 'ramping-arrival-rate', startRate: 5, timeUnit: '1s', preAllocatedVUs: 200,
      stages: [{ target: 30, duration: '2m' }, { target: 30, duration: '5m' }, { target: 0, duration: '1m' }],
    },
  },
  thresholds: { http_req_failed: ['rate<0.02'], 'http_req_duration{route:run}': ['p(95)<1500'] },
};

export default function () {
  const ip = `198.51.100.${(__VU % 250) + 1}`;
  const r = http.post(
    `${__ENV.BASE}/api/sandbox/run`,
    JSON.stringify({ workflowSlug: 'facebook-messenger-crm-google-sheets', scenario: 'messenger', input: 'Pricing for 3 seats?', turnstileToken: __ENV.TURNSTILE_TOKEN || 'XXXX.DUMMY.TOKEN.XXXX' }),
    { headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, tags: { route: 'run' } },
  );
  check(r, { 'ok or rate limited': (x) => x.status === 200 || x.status === 429 });
  sleep(1);
}
