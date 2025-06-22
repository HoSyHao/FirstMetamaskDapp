import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  handleItemListed,
  handleItemSold,
  handleListingCancelled,
  handleOfferMade,
  handleOfferAccepted,
} from "../src/nft-marketplace"
import {
  createItemListedEvent,
  createItemSoldEvent,
  createListingCancelledEvent,
  createOfferMadeEvent,
  createOfferAcceptedEvent,
} from "./nft-marketplace-utils"

// Tests structure
describe("NFTMarketplace entity assertions", () => {
  beforeAll(() => {
    // Test handleItemListed
    let listingId = BigInt.fromI32(1)
    let nftContract = Address.fromString("0x0000000000000000000000000000000000000001")
    let tokenId = BigInt.fromI32(1)
    let seller = Address.fromString("0x0000000000000000000000000000000000000001")
    let price = BigInt.fromI32(100)
    let itemListedEvent = createItemListedEvent(listingId, nftContract, tokenId, seller, price)
    handleItemListed(itemListedEvent)

    // Test handleItemSold
    let buyer = Address.fromString("0x0000000000000000000000000000000000000002")
    let itemSoldEvent = createItemSoldEvent(listingId, nftContract, tokenId, seller, buyer, price)
    handleItemSold(itemSoldEvent)

    // Test handleListingCancelled
    let listingCancelledEvent = createListingCancelledEvent(listingId, seller)
    handleListingCancelled(listingCancelledEvent)

    // Test handleOfferMade
    let offerId = BigInt.fromI32(1)
    let offerPrice = BigInt.fromI32(90)
    let expiresAt = BigInt.fromI32(1698777600) // Example timestamp
    let offerMadeEvent = createOfferMadeEvent(listingId, offerId, buyer, offerPrice, expiresAt)
    handleOfferMade(offerMadeEvent)

    // Test handleOfferAccepted
    let offerAcceptedEvent = createOfferAcceptedEvent(listingId, offerId, buyer, offerPrice)
    handleOfferAccepted(offerAcceptedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  test("Entities created and updated correctly", () => {
    assert.entityCount("Listing", 1)
    assert.entityCount("Sale", 1) // From ItemSold and OfferAccepted
    assert.entityCount("Offer", 1)
    assert.entityCount("User", 2) // seller and buyer

    // Check Listing
    assert.fieldEquals(
      "Listing",
      "1",
      "nftContract",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Listing",
      "1",
      "tokenId",
      "1"
    )
    assert.fieldEquals(
      "Listing",
      "1",
      "seller",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Listing",
      "1",
      "price",
      "100"
    )
    assert.fieldEquals(
      "Listing",
      "1",
      "active",
      "false" // Updated by ItemSold and OfferAccepted
    )

    // Check Sale from ItemSold
    assert.fieldEquals(
      "Sale",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1", // Transaction hash mock
      "listing",
      "1"
    )
    assert.fieldEquals(
      "Sale",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "buyer",
      "0x0000000000000000000000000000000000000002"
    )
    assert.fieldEquals(
      "Sale",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "seller",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Sale",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "price",
      "100"
    )

    // Check Offer
    assert.fieldEquals(
      "Offer",
      "1",
      "listing",
      "1"
    )
    assert.fieldEquals(
      "Offer",
      "1",
      "buyer",
      "0x0000000000000000000000000000000000000002"
    )
    assert.fieldEquals(
      "Offer",
      "1",
      "offerPrice",
      "90"
    )
    assert.fieldEquals(
      "Offer",
      "1",
      "active",
      "false" // Updated by OfferAccepted
    )

    // Check User earnings
    assert.fieldEquals(
      "User",
      "0x0000000000000000000000000000000000000001",
      "totalEarnings",
      "100" // From ItemSold
    )
  })
})