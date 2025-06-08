import { BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import {
  Transfer as TransferEvent,
  NFTMinted as NFTMintedEvent,
  MyNFTCollection as MyNFTCollectionContract,
  Approval as ApprovalEvent, 
  ApprovalForAll as ApprovalForAllEvent, 
  BaseURIUpdated as BaseURIUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
} from "../generated/MyNFTCollection/MyNFTCollection";
import {
  NFTCollection,
  NFT,
  User,
} from "../generated/schema";

// Handle NFTCollection
function handleNFTCollection(contractAddress: Bytes): NFTCollection {
  let collection = NFTCollection.load(contractAddress.toHexString());
  if (!collection) {
    collection = new NFTCollection(contractAddress.toHexString());
    collection.totalSupply = BigInt.fromI32(0);
    collection.owner = contractAddress; // Sử dụng address của contract
    collection.save();
  }
  return collection;
}

// Handle NFTMinted
export function handleNFTMinted(event: NFTMintedEvent): void {
  let collection = handleNFTCollection(event.address);
  let nft = new NFT(event.params.tokenId.toString());
  nft.tokenId = event.params.tokenId;
  let user = User.load(event.params.to.toHexString());
  if (!user) {
    user = new User(event.params.to.toHexString());
    user.totalEarnings = BigInt.fromI32(0);
    user.save();
  }
  nft.owner = user.id;

  // Gọi hàm tokenURI từ contract
  let contract = MyNFTCollectionContract.bind(event.address);
  let tokenURIResult = contract.try_tokenURI(event.params.tokenId);
  if (!tokenURIResult.reverted) {
    nft.tokenURI = tokenURIResult.value;
  } else {
    nft.tokenURI = ""; // Nếu gọi thất bại, để trống
  }

  nft.createdAt = event.block.timestamp;
  nft.save();

  collection.totalSupply = collection.totalSupply.plus(BigInt.fromI32(1));
  collection.save();
}

// Handle Transfer
export function handleTransfer(event: TransferEvent): void {
  let nft = NFT.load(event.params.tokenId.toString());
  if (nft) {
    let user = User.load(event.params.to.toHexString());
    if (!user) {
      user = new User(event.params.to.toHexString());
      user.totalEarnings = BigInt.fromI32(0);
      user.save();
    }
    nft.owner = user.id;
    nft.createdAt = event.block.timestamp;
    nft.save();
  }
}

// Handle Approval (rỗng)
export function handleApproval(event: ApprovalEvent): void {
}

// Handle ApprovalForAll (rỗng)
export function handleApprovalForAll(event: ApprovalForAllEvent): void {
}

// Handle BaseURIUpdated (rỗng)
export function handleBaseURIUpdated(event: BaseURIUpdatedEvent): void {
}

// Handle OwnershipTransferred (rỗng)
export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
}