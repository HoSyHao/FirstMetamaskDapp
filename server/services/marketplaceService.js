// MarketplaceService.js
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
  const listings = result.listings.map(listing => ({
    ...listing,
    seller: listing.seller.id,
  }));
  return listings;
}

async function getSales() {
  const query = gql`
    query GetSales {
      sales(first: 100, orderBy: timestamp, orderDirection: desc) {
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
  const sales = result.sales.map(sale => ({
    ...sale,
    buyer: sale.buyer.id,
    seller: sale.seller.id,
    price: sale.price.toString(), // Chuyển BigInt thành string để dễ xử lý
    timestamp: new Date(parseInt(sale.timestamp.toString()) * 1000).toISOString(), // Chuyển timestamp sang định dạng ISO
  }));
  return sales;
}

module.exports = { getActiveListings, getSales };