import http from 'k6/http';
import { check, fail, sleep } from 'k6';

const apiUrl = __ENV.BTTR_API || 'http://localhost:8000';
const prometheusUrl = __ENV.PROMETHEUS_URL || 'http://localhost:9090';

export const options = {
  scenarios: {
    authenticated_smoke: {
      executor: 'constant-vus',
      vus: Number(__ENV.PERFORMANCE_VUS || 2),
      duration: __ENV.PERFORMANCE_DURATION || '30s',
      gracefulStop: '10s',
    },
  },
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration{name:GET /users/profile}': ['p(95)<750'],
  },
};

function jsonHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Token ${token}`;
  }
  return { headers };
}

function parseJson(response, operation) {
  try {
    return response.json();
  } catch (error) {
    fail(`${operation} retornou JSON inválido: ${response.body}`);
  }
}

function requireStatus(response, expected, operation) {
  if (response.status !== expected) {
    fail(`${operation}: esperado HTTP ${expected}, recebido ${response.status}: ${response.body}`);
  }
}

function waitForPrometheus() {
  const query = encodeURIComponent('up{job="bttr-server"}');
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const response = http.get(`${prometheusUrl}/api/v1/query?query=${query}`, {
      tags: { name: 'GET Prometheus up' },
    });
    if (response.status === 200) {
      const payload = parseJson(response, 'consulta ao Prometheus');
      const targetIsUp = payload.data.result.some((result) => Number(result.value[1]) === 1);
      if (targetIsUp) {
        return;
      }
    }
    sleep(2);
  }
  fail('Prometheus não confirmou o scrape da API dentro do prazo');
}

export function setup() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const account = {
    username: `k6-${suffix}`,
    email: `k6-${suffix}@example.com`,
    password: '!K6performance1',
  };

  const signUp = http.post(`${apiUrl}/users/sign_up`, JSON.stringify(account), {
    ...jsonHeaders(),
    tags: { name: 'POST /users/sign_up' },
  });
  requireStatus(signUp, 200, 'cadastro');

  const signIn = http.post(
    `${apiUrl}/users/sign_in`,
    JSON.stringify({ email: account.email, password: account.password }),
    { ...jsonHeaders(), tags: { name: 'POST /users/sign_in' } },
  );
  requireStatus(signIn, 200, 'login');
  const token = parseJson(signIn, 'login').token;

  const createSkill = http.post(
    `${apiUrl}/skills/create_skill`,
    JSON.stringify({ name: 'Performance', daily: 30 }),
    { ...jsonHeaders(token), tags: { name: 'POST /skills/create_skill' } },
  );
  requireStatus(createSkill, 200, 'criação da habilidade');

  const skills = http.get(`${apiUrl}/skills/skills_from_user`, {
    ...jsonHeaders(token),
    tags: { name: 'GET /skills/skills_from_user' },
  });
  requireStatus(skills, 200, 'consulta da habilidade');
  const skillId = parseJson(skills, 'consulta da habilidade').skills[0].id;

  const metrics = http.get(`${apiUrl}/q/metrics`, {
    tags: { name: 'GET /q/metrics' },
  });
  requireStatus(metrics, 200, 'endpoint Prometheus');
  if (!metrics.body.includes('http_server_requests_seconds')) {
    fail('endpoint Prometheus não publicou métricas HTTP do Micrometer');
  }

  waitForPrometheus();
  return { token, skillId };
}

export default function (data) {
  const profile = http.get(`${apiUrl}/users/profile`, {
    ...jsonHeaders(data.token),
    tags: { name: 'GET /users/profile' },
  });
  check(profile, {
    'perfil responde HTTP 200': (response) => response.status === 200,
    'perfil contém o usuário': (response) => response.json('user.email') !== undefined,
  });

  const skills = http.get(`${apiUrl}/skills/skills_by_page?page=1`, {
    ...jsonHeaders(data.token),
    tags: { name: 'GET /skills/skills_by_page' },
  });
  check(skills, {
    'habilidades respondem HTTP 200': (response) => response.status === 200,
    'habilidades contêm resultados': (response) => Array.isArray(response.json('results')),
  });

  const createTime = http.post(
    `${apiUrl}/times/create_time`,
    JSON.stringify({ skill_id: data.skillId, minutes: 15 }),
    { ...jsonHeaders(data.token), tags: { name: 'POST /times/create_time' } },
  );
  check(createTime, {
    'registro de tempo responde HTTP 200': (response) => response.status === 200,
  });

  const times = http.get(`${apiUrl}/times/times_by_page?page=1`, {
    ...jsonHeaders(data.token),
    tags: { name: 'GET /times/times_by_page' },
  });
  check(times, {
    'tempos respondem HTTP 200': (response) => response.status === 200,
    'tempos contêm resultados': (response) => Array.isArray(response.json('results')),
  });

  sleep(0.5);
}

export function teardown(data) {
  if (!data || !data.token) {
    return;
  }
  const response = http.del(`${apiUrl}/users/profile`, null, {
    ...jsonHeaders(data.token),
    tags: { name: 'DELETE /users/profile' },
  });
  check(response, {
    'conta temporária foi excluída': (result) => result.status === 200,
  });
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function thresholdResults(data) {
  const results = [];
  for (const [metricName, metric] of Object.entries(data.metrics)) {
    for (const [expression, threshold] of Object.entries(metric.thresholds || {})) {
      results.push({
        name: `${metricName}: ${expression}`,
        ok: threshold.ok,
      });
    }
  }
  return results;
}

export function handleSummary(data) {
  const results = thresholdResults(data);
  const failures = results.filter((result) => !result.ok);
  const cases = results
    .map((result) => {
      const failure = result.ok
        ? ''
        : `<failure message="threshold excedido">${escapeXml(result.name)}</failure>`;
      return `<testcase classname="k6.threshold" name="${escapeXml(result.name)}">${failure}</testcase>`;
    })
    .join('');
  const junit =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<testsuite name="k6 performance smoke" tests="${results.length}" failures="${failures.length}">` +
    `${cases}</testsuite>`;

  return {
    '/results/summary.json': JSON.stringify(data, null, 2),
    '/results/junit.xml': junit,
    stdout: `k6: ${results.length} thresholds, ${failures.length} falhas\n`,
  };
}
