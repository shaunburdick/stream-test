'use strict';

const neo4j = require('neo4j-driver').v1;
const async = require('async');
const nodeGenerator = require('./lib/nodeGenerator');

console.log('Generating cluster...');
const nodes = nodeGenerator.genCluster(100000);
console.log('Done!');

// Probably way better ways to do this type of thing but I wanted it to by dynamic every time
// and I didn't want to spend a lot of time researching bulk imports :-p
// The delay is super hacky for docker-compose

setTimeout(() => {
  // Create each node
  const cypherCreate = [];
  nodes.forEach((node) => {
    cypherCreate.push(`(:Node {name:'${node.name}'})`);
  });

  // neo4j on my laptop can only insert about 1000 at a time this method
  const chunks = ((arr) => {
    const retVal = [];
    while (arr.length) {
      retVal.push(arr.splice(0, 1000));
    }

    return retVal;
  })(cypherCreate);

  const neo4jUrl = process.env.NEO4J_URL || 'bolt://localhost';
  const driver = neo4j.driver(neo4jUrl, neo4j.auth.basic('neo4j', '12345'));
  const session = driver.session();

  console.log('Inserting Nodes...');
  async.series(chunks.map((chunk, idx) => (done) => {
    console.log(`Creating chunk ${idx}`);
    session.run(`CREATE ${chunk.join()}`)
    .then(() => done())
    .catch((err) => done(err));
  }), (err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log('Creating index...');
    session
      .run('CREATE INDEX ON :Node(name)')
      .then(() => {
        // after node creation, create relationships
        console.log('Creating relationships...');
        // It's way to slow to do these on your own I learn 1 hour in :-p
        // const relationshipQueries = []; // holds all the run promises
        // nodes.forEach((node) => {
        //   const relMatches = [];
        //   const relRelationships = [];
        //   node.relationships.forEach((rel, idx) => {
        //     relMatches.push(`(r${idx}:Node {name: "${rel}"})`);
        //     relRelationships.push(`(parent)-[:REDIRECTS]->(r${idx})`);
        //   });
        //   const cypherRel = `MATCH (parent:Node {name: "${node.name}"}), ${relMatches.join(', ')} CREATE ${relRelationships.join(', ')};`;
        //   relationshipQueries.push(session.run(cypherRel));
        // });
        //
        // return Promise.all(relationshipQueries);

        // http://jexp.de/blog/2014/03/quickly-create-a-100k-neo4j-graph-data-model-with-cypher-only/
        return session.run('MATCH (n1:Node),(n2:Node) WITH n1,n2 LIMIT 2000000 WHERE rand() < 0.1 CREATE (n1)-[:REDIRECTS]->(n2);');
      })
      .then(() => {
        console.log('Starting random data change job...');
        setInterval(() => changeData(session), 60000);
      })
      .catch((err) => {
        console.log(err);
        process.exit(1);
      });
  });
}, 20000);

/**
 * Mess with the relationships and data
 *
 * @param {Session} session a neo4j session
 * @return {null} nada
 */
function changeData (session) {
  // delete some stuff
  session
    .run('MATCH (n:Node) WITH n LIMIT 5000 DETACH DELETE (n)')
    .then(() => {
      // create a few new nodes
      console.log('Generating cluster...');
      const nodes = nodeGenerator.genCluster(1000);
      console.log('Done!');

      // Create each node
      const cypherCreate = [];
      nodes.forEach((node) => {
        cypherCreate.push(`(:Node {name:'${node.name}'})`);
      });
      console.log('Creating new nodes...');
      return session.run(`CREATE ${cypherCreate.join()}`);
    })
    .then(() => {
      // create some new relationships
      console.log('Creating new relationships...');
      return session.run('MATCH (n1:Node),(n2:Node) WITH n1,n2 LIMIT 5000 WHERE rand() < 0.1 CREATE (n1)-[:REDIRECTS]->(n2);');
    })
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
}
