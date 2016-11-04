'use strict';

// Quick charmap
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Generate a random .com domain name
 *
 * @return {string} domain name
 */
function genDomain () {
  let retVal = '';

  for (let i = 0; i < 20; i++) {
    retVal += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${retVal}.com`;
}

/**
 * Generate a random IPv4, don't expect them to be valid
 *
 * @return {string} ip address
 */
function genIP () {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

/**
 * Generate a cluster of nodes at a specified length
 *
 * @param {integer} size the size of the cluster
 * @return {object[]} an array of nodes and relationships
 * @example
 * [
 *   {
 *     name: string, name of the node
 *     relationships: string[], an array of names it is related to
 *   }
 * ]
 */
function genCluster (size) {
  const retVal = [];
  const names = new Set(); // keep track of unique names

  for (let i = 0; i < size; i++) {
    const name = (Math.random() < 0.5) ? genDomain() : genIP();
    names.add(name); // add names to set for relationships

    retVal.push({
      name,
      relationships: []
    });
  }

  // build relationships
  const nameArr = [...names];
  retVal.forEach((node) => {
    // add up to 10 relationships
    const numRel = Math.floor(Math.random() * 8) + 2; // always 2 or more
    for (let k = 0; k < numRel; k++) {
      node.relationships.push(nameArr[Math.floor(Math.random() * nameArr.length)]);
    }

    node.relationships = [...new Set(node.relationships)]; // unique it
  });

  return retVal;
}

module.exports = {
  genDomain,
  genIP,
  genCluster
};
