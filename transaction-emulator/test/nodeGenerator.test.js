'use strict';

const test = require('tape');
const nodeGenerator = require(`${process.cwd()}/lib/nodeGenerator`);

/**
 * Test a domain
 * Checks for string ending in '.com' (not a good check but not important to project)
 *
 * @param {string} domain a domain name
 * @return {boolean} true if ok, false otherwise
 */
function testDomain (domain) {
  return /\.com$/.test(domain);
}

/**
 * Test an ip
 * Checks for string with four clustes of digits (not a good check but not important to project)
 *
 * @param {string} ip an IP address
 * @return {boolean} true if ok, false otherwise
 */
function testIP (ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

test('Node Generator: should exist', (assert) => {
  assert.ok(nodeGenerator, 'Node Generator constant should be ok');
  assert.end();
});

test('Node Generator: Should generate a domain name', (assert) => {
  const domain = nodeGenerator.genDomain();
  assert.ok(domain, 'genDomain should return a non-error result');
  assert.equal(typeof domain, 'string', 'genDomain should return a string');
  assert.ok(testDomain(domain), 'generated domain should end it .com');
  assert.end();
});

test('Node Generator: Should generate an IP address', (assert) => {
  const ip = nodeGenerator.genIP();
  assert.ok(ip, 'genIP should return a non-error result');
  assert.equal(typeof ip, 'string', 'genIP should return a string');
  assert.ok(testIP(ip), 'Simple format test, no need to get fancy');
  assert.end();
});

test('Node Generator: Should generate a node cluster', (assert) => {
  const len = 10; // length of cluster I want
  const cluster = nodeGenerator.genCluster(len);
  assert.ok(cluster, 'genCluster should return a non-error result');
  assert.equal(cluster.length, len, 'genCluster should generate the number of nodes I ask for');

  const names = new Set(
    cluster.reduce((list, node) => {
      list.push(node.name);
      return list;
    }, [])
  );

  cluster.forEach((node) => {
    if (!(testDomain(node.name) || testIP(node.name))) {
      assert.fail(`Node.name is not a valid IP or Domain (${node.name})`);
      // check relationships to be sure they are valid
      node.relationships.forEach((rel) => {
        if (!names.has(rel)) {
          assert.fail(`${node.name} has relationship ${rel} that is not in cluster`);
        }
      });
    }
  });

  assert.end();
});
