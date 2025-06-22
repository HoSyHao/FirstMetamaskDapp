import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { handleNFTMinted, handleTransfer } from "../src/my-nft-collection"
import { createNFTMintedEvent, createTransferEvent } from "./my-nft-collection-utils"

// Tests structure
describe("MyNFTCollection entity assertions", () => {
  beforeAll(() => {
    // Test handleNFTMinted
    let to = Address.fromString("0x0000000000000000000000000000000000000001")
    let tokenId = BigInt.fromI32(1)
    let nftMintedEvent = createNFTMintedEvent(to, tokenId)
    handleNFTMinted(nftMintedEvent)

    // Test handleTransfer
    let from = Address.fromString("0x0000000000000000000000000000000000000001")
    let toNew = Address.fromString("0x0000000000000000000000000000000000000002")
    let transferEvent = createTransferEvent(from, toNew, tokenId)
    handleTransfer(transferEvent)
  })

  afterAll(() => {
    clearStore()
  })

  test("NFTMinted creates NFT and updates NFTCollection", () => {
    assert.entityCount("NFTCollection", 1)
    assert.entityCount("NFT", 1)
    assert.entityCount("User", 2) // 1 from mint, 1 from transfer

    assert.fieldEquals(
      "NFTCollection",
      "0x...",
      "totalSupply",
      "1"
    )
    assert.fieldEquals(
      "NFT",
      "1",
      "owner",
      "0x0000000000000000000000000000000000000002" // Updated by transfer
    )
    assert.fieldEquals(
      "NFT",
      "1",
      "tokenId",
      "1"
    )
    assert.fieldEquals(
      "User",
      "0x0000000000000000000000000000000000000001",
      "totalEarnings",
      "0"
    )
    assert.fieldEquals(
      "User",
      "0x0000000000000000000000000000000000000002",
      "totalEarnings",
      "0"
    )
  })
})