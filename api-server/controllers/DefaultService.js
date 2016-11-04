'use strict';

const neo4j = require('neo4j-driver').v1;

exports.nodeGET = function (args, res, next) {
  /**
   * parameters expected in the args:
   * limit (BigDecimal)
   * skip (BigDecimal)
   * node (String)
   */

  const limit = +args.limit.value || 10;
  const skip = +args.skip.value || 0;
  const node = args.node.value || null;

  const neo4jUrl = process.env.NEO4J_URL || 'bolt://localhost';
  const driver = neo4j.driver(neo4jUrl, neo4j.auth.basic('neo4j', '12345')); // hard coded cause I'm lazy
  const session = driver.session();

  const cypherWhere = `WHERE a.name = "${node}"`;
  const cypher = `
    MATCH (a:Node)<-[:REDIRECTS]-(b:Node)
    ${node ? cypherWhere : ''}
    RETURN a.name as source, b.name as target
    SKIP ${skip}
    LIMIT ${limit}
  `;

  session
    .run(cypher)
    .then((results) => {
      if (results && results.records) {
        const retVal = {
          nodes: [],
          links: []
        };

        results.records.forEach((record) => {
          retVal.nodes.push({ name: record.get('source') });
          retVal.nodes.push({ name: record.get('target') });
          retVal.links.push({
            source: record.get('source'),
            target: record.get('target')
          });
        });

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          data: retVal,
          links: {
            self: 'foo'
          }
        }));
      } else {
        console.error('No records found');
        res.end();
      }
      session.close();
      driver.close();
    })
    .catch((err) => {
      console.error(err);
      res.end();
      session.close();
      driver.close();
    });
};
