import { BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import {
  ItemListed as ItemListedEvent,
  ItemSold as ItemSoldEvent,
  ListingCancelled as ListingCancelledEvent,
  OfferMade as OfferMadeEvent,
  OfferAccepted as OfferAcceptedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PriceUpdated as PriceUpdatedEvent,
} from "../generated/NFTMarketplace/NFTMarketplace";
import {
  Listing,
  Sale,
  Offer,
  User,
} from "../generated/schema";

// Handle ItemListed
export function handleItemListed(event: ItemListedEvent): void {
  let listing = new Listing(event.params.listingId.toString());
  listing.nftContract = event.params.nftContract;
  listing.tokenId = event.params.tokenId;
  let user = User.load(event.params.seller.toHexString());
  if (!user) {
    user = new User(event.params.seller.toHexString());
    user.totalEarnings = BigInt.fromI32(0);
    user.save();
  }
  listing.seller = user.id;
  listing.price = event.params.price;
  listing.active = true;
  listing.createdAt = event.block.timestamp;
  listing.save();
}

// Handle ItemSold
export function handleItemSold(event: ItemSoldEvent): void {
  let listingId = event.params.listingId.toString();
  let listing = Listing.load(listingId);
  if (listing) {
    listing.active = false;
    listing.save();

    let sale = new Sale(event.transaction.hash.toHex());
    sale.listing = listingId;
    let buyer = User.load(event.params.buyer.toHexString());
    if (!buyer) {
      buyer = new User(event.params.buyer.toHexString());
      buyer.totalEarnings = BigInt.fromI32(0);
      buyer.save();
    }
    let seller = User.load(event.params.seller.toHexString());
    if (!seller) {
      seller = new User(event.params.seller.toHexString());
      seller.totalEarnings = BigInt.fromI32(0);
      seller.save();
    }
    sale.buyer = buyer.id;
    sale.seller = seller.id;
    sale.price = event.params.price;
    sale.timestamp = event.block.timestamp;
    sale.save();

    // Cập nhật totalEarnings của seller
    seller.totalEarnings = seller.totalEarnings.plus(event.params.price);
    seller.save();
  }
}

// Handle ListingCancelled
export function handleListingCancelled(event: ListingCancelledEvent): void {
  let listing = Listing.load(event.params.listingId.toString());
  if (listing) {
    listing.active = false;
    listing.save();
  }
}

// Handle OfferMade
export function handleOfferMade(event: OfferMadeEvent): void {
  let offer = new Offer(event.params.offerId.toString());
  offer.listing = event.params.listingId.toString();
  let user = User.load(event.params.buyer.toHexString());
  if (!user) {
    user = new User(event.params.buyer.toHexString());
    user.totalEarnings = BigInt.fromI32(0);
    user.save();
  }
  offer.buyer = user.id;
  offer.offerPrice = event.params.offerPrice;
  offer.expiresAt = event.params.expiresAt;
  offer.active = true;
  offer.save();
}

// Handle OfferAccepted
export function handleOfferAccepted(event: OfferAcceptedEvent): void {
  let offer = Offer.load(event.params.offerId.toString());
  if (offer) {
    offer.active = false;
    offer.save();

    let sale = new Sale(event.transaction.hash.toHex());
    sale.listing = offer.listing;
    let buyer = User.load(event.params.buyer.toHexString());
    if (!buyer) {
      buyer = new User(event.params.buyer.toHexString());
      buyer.totalEarnings = BigInt.fromI32(0);
      buyer.save();
    }
    // Lấy seller từ listing
    let listing = Listing.load(offer.listing);
    let seller: User | null = null;
    if (listing) {
      seller = User.load(listing.seller);
      if (!seller) {
        seller = new User(listing.seller);
        seller.totalEarnings = BigInt.fromI32(0);
        seller.save();
      }
    }
    sale.buyer = buyer.id;
    sale.seller = seller ? seller.id : ""; // Gán ID của seller từ listing
    sale.price = offer.offerPrice;
    sale.timestamp = event.block.timestamp;
    sale.save();

    if (listing) {
      listing.active = false;
      listing.save();

      // Cập nhật totalEarnings của seller
      if (seller) {
        seller.totalEarnings = seller.totalEarnings.plus(offer.offerPrice);
        seller.save();
      }
    }
  }
}

// Handle OwnershipTransferred (rỗng không cần xử lý)
export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  
}

// Handle PriceUpdated (rỗng không cần xử lý)
export function handlePriceUpdated(event: PriceUpdatedEvent): void {
  
}