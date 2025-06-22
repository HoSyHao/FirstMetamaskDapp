const { request, gql } = require('graphql-request');
const config = require('../config/config');

async function getActiveListings() {
  const query = gql`
    query GetActiveListings {
      listings(where: { active: true }) {
        id
        nftContract
        tokenId
        seller {
          id
        }
        price
        active
        createdAt
      }
    }
  `;
  const result = await request(config.subgraphEndpoint, query);
  return result.listings;
}

async function getSales() {
  const query = gql`
    query GetSales {
      sales(first: 10) {
        id
        listing {
          id
          tokenId
        }
        buyer {
          id
        }
        seller {
          id
        }
        price
        timestamp
      }
    }
  `;
  const result = await request(config.subgraphEndpoint, query);
  return result.sales;
}

async function getUserOffers(userAddress) {
  const query = gql`
    query GetUserOffers($userAddress: String!) {
      offers(where: { buyer: $userAddress, active: true }) {
        id
        listing {
          id
          tokenId
        }
        buyer {
          id
        }
        offerPrice
        expiresAt
        active
      }
    }
  `;
  const variables = { userAddress };
  const result = await request(config.subgraphEndpoint, query, variables);
  return result.offers;
}

module.exports = { getActiveListings, getSales, getUserOffers };