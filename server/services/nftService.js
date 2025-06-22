const { request, gql } = require('graphql-request');
const config = require('../config/config');

async function getUserNfts(userAddress) {
  const query = gql`
    query GetUserNfts($userAddress: String!) {
      nfts(where: { owner: $userAddress }) {
        id
        tokenId
        owner {
          id
        }
        tokenURI
        createdAt
      }
    }
  `;
  const variables = { userAddress };
  const result = await request(config.subgraphEndpoint, query, variables);
  return result.nfts;
}

module.exports = { getUserNfts };