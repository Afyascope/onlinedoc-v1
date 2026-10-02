#!/usr/bin/env node
'use strict';

// Safe metadata only: never print credential values.
const { execFileSync } = require('node:child_process');

const env = process.env;

function credential(name) {
  const value = env[name];
  if (value === undefined) return `${name}: not set`;
  const hasWhitespace = value !== value.trim();
  const hasNewline = /[\r\n]/.test(value);
  return `${name}: set, length=${value.length}, leadingOrTrailingWhitespace=${hasWhitespace}, containsNewline=${hasNewline}`;
}

function value(name) {
  const item = env[name];
  return `${name}: ${item === undefined ? 'not set' : item.length === 0 ? '(empty)' : item}`;
}

function endpointHostname() {
  const endpoint = env.R2_ENDPOINT;
  if (endpoint === undefined) return 'R2_ENDPOINT: not set';
  if (endpoint.length === 0) return 'R2_ENDPOINT: (empty)';
  try {
    return `R2_ENDPOINT hostname: ${new URL(endpoint).hostname}`;
  } catch {
    return 'R2_ENDPOINT: set, invalid URL';
  }
}

function commitSha() {
  for (const key of ['RAILWAY_GIT_COMMIT_SHA', 'GIT_COMMIT_SHA', 'SOURCE_VERSION']) {
    if (env[key]) return env[key];
  }
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unavailable';
  }
}

let providerVersion = 'unavailable';
try {
  providerVersion = require('@strapi/provider-upload-aws-s3/package.json').version;
} catch {
  // The package may be absent from a local environment that uses another provider.
}

console.log([
  credential('R2_ACCESS_KEY_ID'),
  credential('R2_SECRET_ACCESS_KEY'),
  endpointHostname(),
  value('R2_BUCKET'),
  value('R2_PRODUCT_PREFIX'),
  value('UPLOAD_PROVIDER'),
  credential('AWS_ACCESS_KEY_ID'),
  credential('AWS_SECRET_ACCESS_KEY'),
  credential('AWS_SESSION_TOKEN'),
  value('AWS_REGION'),
  value('AWS_DEFAULT_REGION'),
  value('AWS_PROFILE'),
  value('NODE_ENV'),
  `provider package version: ${providerVersion}`,
  `commit SHA: ${commitSha()}`,
].join('\n'));
