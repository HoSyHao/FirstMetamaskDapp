const { request, gql } = require('graphql-request');
const config = require('../config/config');

async function getActiveListings({ page, limit }) {
  const query = gql`
    query GetActiveListings($skip: Int!, $first: Int!) {
      _meta {
        block {
          number
        }
      }
      listingsCount: listings(where: { active: true }) {
        id
      }
      listings(where: { active: true }, skip: $skip, first: $first) {
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
  const skip = (page - 1) * limit;
  try {
    const result = await request(config.subgraphEndpoint, query, { skip, first: limit })
    const listings = result.listings.map(listing => ({
      ...listing,
      seller: listing.seller.id,
      createdAt: new Date(parseInt(listing.createdAt.toString()) * 1000).toISOString(),
    }));
    const total = result.listingsCount.length; // Tổng số listings active
    return { data: listings, total };
  } catch (error) {
    console.error('GraphQL Error in getActiveListings:', error.response?.errors || error);
    throw error;
  }
}

async function getSales({ page, limit }) {
  const query = gql`
    query GetSales($skip: Int!, $first: Int!) {
      _meta {
        block {
          number
        }
      }
      salesCount: sales {
        id
      }
      sales(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
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
  const skip = (page - 1) * limit;
  try {
    const result = await request(config.subgraphEndpoint, query, { skip, first: limit });
    const sales = result.sales.map(sale => ({
      ...sale,
      buyer: sale.buyer.id,
      seller: sale.seller.id,
      price: sale.price.toString(),
      timestamp: new Date(parseInt(sale.timestamp.toString()) * 1000).toISOString(),
    }));
    const total = result.salesCount.length; // Tổng số sales
    return { data: sales, total };
  } catch (error) {
    console.error('GraphQL Error in getSales:', error.response?.errors || error);
    throw error;
  }
}

module.exports = { getActiveListings, getSales };