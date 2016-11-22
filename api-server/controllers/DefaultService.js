'use strict';

const crypto = require('crypto');
const neo4j = require('neo4j-driver').v1;
const neo4jUrl = process.env.NEO4J_URL || 'bolt://localhost';
const driver = neo4j.driver(neo4jUrl, neo4j.auth.basic('neo4j', '12345')); // hard coded cause I'm lazy
const socketHelper = require('../lib/socket');

const changeJobs = new Map();

/**
 * Return force graph formated list of nodes
 *
 * @param  {object}   args Swaggerized list of arguments
 * @param  {Request}  req  Express Request object
 * @param  {Response} res  Express Response object
 * @param  {Function} next next callback
 * @return {null}          Nada
 */
exports.nodeGET = function (args, req, res, next) {
  /**
   * parameters expected in the args:
   * sockId: (String)
   * limit (BigDecimal)
   * skip (BigDecimal)
   * depth (BigDecimal)
   * node (String)
   */

  const limit = +args.limit.value || 10;
  const skip = +args.skip.value || 0;
  const node = args.node.value || null;
  const depth = +args.depth.value || 3;
  const socketId = args.sockId.value;

  const session = driver.session();

  const cypherWhere = `WHERE a.name = "${node}"`;
  const cypher = `
    MATCH (a:Node)<-[:REDIRECTS*1..${depth}]-(b:Node)
    ${node ? cypherWhere : ''}
    RETURN a.name as source, b.name as target
    SKIP ${skip}
    LIMIT ${limit}
  `;
  const cypherId = hashCypher(cypher);

  session
    .run(cypher)
    .then((results) => {
      if (results && results.records) {
        const retVal = {
          nodes: [],
          links: [],
          socket: {
            channel: cypherId
          }
        };

        results.records.forEach((record) => {
          retVal.nodes.push({ name: record.get('source') });
          retVal.nodes.push({ name: record.get('target') });
          retVal.links.push({
            source: record.get('source'),
            target: record.get('target')
          });
        });

        // unique the node names
        retVal.nodes = [...new Set(retVal.nodes)];
        startChangeJob(socketId, retVal);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          data: retVal,
          links: {
            self: req.originalUrl
          }
        }));
      } else {
        console.error('No records found');
        res.end();
      }
      session.close();
    })
    .catch((err) => {
      console.error(err);
      res.end();
      session.close();
    });
};

/**
 * Hash a cypher to a unique ID
 *
 * @param  {string} cypher The cyper query
 * @return {string}        The hash
 */
function hashCypher (cypher) {
  return crypto.createHash('md5').update(cypher).digest('hex');
}

/**
 * Start a fake change job that alters return values
 * sends commands to add/remote nodes and links
 *
 * @example {
 *   add: [
 *     { type: 'node', data: { name: 'foo'} },
 *     { type: 'link', data: { source: 'foo', target: 'bar'} }
 *   ],
 *   remove: [
 *     { type: 'node', data: { name: 'foo'} },
 *     { type: 'link', data: { source: 'foo', target: 'bar'} }
 *   ]
 * }
 *
 * @param  {string} socketId the socket to join to the channel
 * @param  {object} data     the original return payload
 * @return {null}            nada
 */
function startChangeJob (socketId, data) {
  if (!changeJobs.has(data.socket.channel)) {
    console.log(`Joining ${socketId} to ${data.socket.channel}`);
    // get the socket object
    const io = socketHelper.get();
    if (!io.sockets.connected.hasOwnProperty(socketId)) {
      console.log(`Unknown socket id: ${socketId}`);
    } else {
      const socket = io.sockets.connected[socketId];
      socket.join(data.socket.channel);

      console.log(`Creating new job for: ${data.socket.channel}`);
      changeJobs.set(data.socket.channel,
        setInterval(() => {
          // get socket
          io.to(data.socket.channel).emit(data.socket.channel, `Hello ${data.socket.channel}!`);
        }, 5000)
      );
    }
  } else {
    console.log(`Existing job for ${data.socket.channel}`);
  }
}
