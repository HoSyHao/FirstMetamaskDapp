const { request, gql } = require('graphql-request');
const config = require('../config/config');

async function getUser(userAddress) {
  const query = gql`
    query GetUser($userAddress: String!) {
      users(where: { id: $userAddress }) {
        id
        totalEarnings
        nftsOwned {
          id
          tokenId
          tokenURI
        }
        nftsListed {
          id
          tokenId
          price
          active
        }
      }
    }
  `;
  const variables = { userAddress };
  const result = await request(config.subgraphEndpoint, query, variables);
  return result.users[0] || { id: userAddress, totalEarnings: "0", nftsOwned: [], nftsListed: [] }; // Giá trị mặc định nếu không tìm thấy
}

module.exports = { getUser };