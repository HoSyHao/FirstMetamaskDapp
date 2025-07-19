import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { addTransaction } from '../redux/slices/marketplace/transactionsSlice';
import { setLoading } from '../redux/slices/training/contractSlice';
import { marketplaceAddress, nftCollectionABI, nftCollectionAddress } from '../constants/contract';
import { socket } from '../lib/socketClient';
import { addNFT, removeNFT } from '../redux/slices/marketplace/nftSlice';
import { addListing, removeListing } from '../redux/slices/marketplace/listingSlice';

export const mintNFT = async (contract, quantity, account, dispatch, updateBalances) => {
  if (!contract || !contract.signer) {
    toast.error('Contract or signer not initialized');
    return;
  }
  dispatch(setLoading(true));
  try {
    const tokenIdBefore = await contract.getCurrentTokenId();
    console.log('TokenId before mint:', tokenIdBefore.toString());

    const tx = await contract.mint(quantity, { gasLimit: 125000 });
    const receipt = await tx.wait();
    console.log('Mint receipt:', receipt);
    await updateBalances();

    let tokenIds = [];
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === "NFTMinted") {
          tokenIds.push(parsedLog.args.tokenId.toString());
        }
      } catch (err) {
        // Bỏ qua log không parse được
      }
    }

    if (tokenIds.length === 0) {
      // Fallback: Lấy tokenId từ trạng thái contract sau mint
      const tokenIdAfter = await contract.getCurrentTokenId();
      tokenIds = Array.from({ length: quantity }, (_, i) => (parseInt(tokenIdAfter) + i).toString());
      console.warn('No NFTMinted events found, using fallback tokenIds:', tokenIds);
    }

    console.log('Minted tokenIds:', tokenIds);

    const tokenURIs = await Promise.all(tokenIds.map(async (tokenId) => {
      try {
        return await contract.tokenURI(tokenId);
      } catch (uriError) {
        console.warn(`Failed to fetch tokenURI for tokenId ${tokenId}:`, uriError);
        return `https://example.com/nft/${tokenId}.json`; // Fallback URI
      }
    }));

    tokenIds.forEach((tokenId, index) => {
      dispatch(addNFT({ tokenId, tokenURI: tokenURIs[index] }));
      socket.emit('marketplaceEvent', {
        type: 'NFTMinted',
        userAddress: account,
        tokenId: tokenId,
        tokenURI: tokenURIs[index],
        timestamp: new Date().toISOString(),
      });
    });

    toast.success('Minted successfully!');
    return { tokenIds, tokenURIs }; // Trả về object chứa mảng tokenIds và tokenURIs
  } catch (error) {
    console.error('Error minting:', error);
    if (error.code !== 'ACTION_REJECTED') {
      toast.error('Mint failed: ' + (error.message || 'Unknown error'));
    } else {
      toast.info('Transaction rejected');
    }
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const buyItem = async (contract, listingId, account, dispatch, updateBalances) => {
  if (!contract || !contract.signer) {
    toast.error('Contract or signer not initialized');
    return;
  }
  dispatch(setLoading(true));
  try {
    console.log('Fetching listing for listingId:', listingId);
    const listing = await contract.listings(listingId);
    console.log('Fetched listing from contract:', listing);
    if (!listing || !listing.price || ethers.toBigInt(listing.price) <= 0) {
      throw new Error(`Invalid listing: No price or listing not found for listingId ${listingId}`);
    }
    const price = listing.price.toString();
    console.log('Buying with price:', price);
    const tx = await contract.buyItem(listingId, { value: price, gasLimit: 290000 });

    // Thêm transaction cho người mua
    const buyerTransaction = {
      id: listingId.toString(),
      listing: { id: listingId.toString(), tokenId: listing.tokenId?.toString() || 'N/A' },
      buyer: account,
      seller: listing.seller?.toString() || 'N/A',
      price: price,
      timestamp: new Date().toISOString(),
    };
    dispatch(addTransaction(buyerTransaction));
    console.log('Added transaction for buyer:', buyerTransaction);

    const receipt = await tx.wait();
    console.log('Buy receipt:', receipt);
    await updateBalances();

    let tokenId = 'pending';
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === "ItemSold") {
          tokenId = parsedLog.args.tokenId.toString();
          break;
        }
      } catch (err) {
        // Bỏ qua log không parse được
      }
    }
    console.log('Sold tokenId:', tokenId);

    // Thêm NFT cho buyer
    let buyerTokenURI = 'Loading...';
    if (!isNaN(tokenId)) {
      try {
        const nftContract = new ethers.Contract(nftCollectionAddress, nftCollectionABI, contract.signer);
        buyerTokenURI = await nftContract.tokenURI(tokenId);
        console.log('Fetched buyer tokenURI:', buyerTokenURI);
      } catch (uriError) {
        console.warn('Failed to fetch buyer tokenURI:', uriError);
        buyerTokenURI = `https://example.com/nft/${tokenId}.json`; // Fallback URI
      }
    }
    dispatch(addNFT({ tokenId, tokenURI: buyerTokenURI }));

    // Thêm transaction và toast cho người bán qua socket
    const sellerTransaction = {
      id: listingId.toString(),
      listing: { id: listingId.toString(), tokenId: tokenId },
      buyer: account,
      seller: listing.seller?.toString() || 'N/A',
      price: price,
      timestamp: new Date().toISOString(),
    };
    socket.emit('marketplaceEvent', {
      type: 'ItemSold',
      userAddress: account, // Người mua
      listingId: listingId.toString(),
      tokenId: tokenId,
      price: price,
      seller: listing.seller?.toString() || 'N/A',
      timestamp: new Date().toISOString(),
      sellerTransaction: JSON.stringify(sellerTransaction),
      buyerTransaction: JSON.stringify(buyerTransaction),
      buyerTokenURI: buyerTokenURI, // Gửi tokenURI cho buyer
    });

    toast.success('Bought successfully!');
    return true;
  } catch (error) {
    console.error('Error buying:', error);
    if (error.code !== 'ACTION_REJECTED') {
      toast.error('Buy failed: ' + (error.message || 'Unknown error'));
    } else {
      toast.info('Transaction rejected');
    }
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const listItem = async (contract, tokenId, price, account, dispatch, updateBalances) => {
  if (!contract || !contract.signer) {
    toast.error('Contract not initialized');
    return;
  }
  const nftContract = new ethers.Contract(nftCollectionAddress, nftCollectionABI, contract.signer);
  dispatch(setLoading(true));
  try {
    console.log('Listing tokenId:', tokenId, 'with price:', price);

    console.log('Checking approval for tokenId:', tokenId);
    const isApproved = await nftContract.getApproved(tokenId);
    if (isApproved.toLowerCase() !== marketplaceAddress.toLowerCase()) {
      console.log('Approving NFT...');
      const approveTx = await nftContract.approve(marketplaceAddress, tokenId, { gasLimit: 100000 });
      const approveReceipt = await approveTx.wait();
      console.log('Approve receipt:', approveReceipt);
    }

    console.log('Listing item...');
    const tx = await contract.listItem(nftCollectionAddress, tokenId, price, { gasLimit: 310000 });
    const receipt = await tx.wait();
    console.log('List receipt:', receipt);
    await updateBalances();

    let listingId = 'pending';
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === "ItemListed") {
          listingId = parsedLog.args.listingId.toString();
          break;
        }
      } catch (err) {
        // Bỏ qua log không parse được (không thuộc contract này)
      }
    }
    console.log('Listed listingId:', listingId);

    dispatch(removeNFT(tokenId));
    dispatch(addListing({ id: listingId, tokenId, price, seller: account }));
    socket.emit('marketplaceEvent', {
      type: 'ItemListed',
      userAddress: account,
      tokenId: tokenId.toString(),
      price: price.toString(),
      listingId: listingId,
      timestamp: new Date().toISOString(),
    });

    toast.success('Listed successfully!');
    return true;
  } catch (error) {
    console.error('Error listing:', error);
    if (error.code !== 'ACTION_REJECTED') {
      toast.error('List failed: ' + (error.message || 'Unknown error'));
    } else {
      toast.info('Transaction rejected');
    }
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const cancelListing = async (contract, listingId, account, dispatch, updateBalances) => {
  if (!contract || !contract.signer) {
    toast.error('Contract or signer not initialized');
    return;
  }
  const nftContract = new ethers.Contract(nftCollectionAddress, nftCollectionABI, contract.signer);
  dispatch(setLoading(true));
  try {
    console.log('Cancelling listingId:', listingId);
    const tx = await contract.cancelListing(listingId, { gasLimit: 100000 });
    const receipt = await tx.wait();
    console.log('Cancel receipt:', receipt);
    await updateBalances();

    
    const listing = await contract.listings(listingId);
    const tokenId = listing.tokenId?.toString();
    const tokenURI = await nftContract.tokenURI(tokenId);

    dispatch(removeListing(listingId));
    dispatch(addNFT({ tokenId, tokenURI: tokenURI }));
    socket.emit('marketplaceEvent', {
      type: 'ListingCancelled',
      userAddress: account,
      listingId: listingId.toString(),
      timestamp: new Date().toISOString(),
    });

    toast.success('Listing cancelled successfully!');
    return true;
  } catch (error) {
    console.error('Error cancelling listing:', error);
    if (error.code !== 'ACTION_REJECTED') {
      toast.error('Cancel failed: ' + (error.message || 'Unknown error'));
    } else {
      toast.info('Transaction rejected');
    }
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};