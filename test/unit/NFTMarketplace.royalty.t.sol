// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

import {NFTMarketplace} from "../../src/NFTMarketplace.sol";
import {MockERC721} from "../mocks/MockERC721.sol";
import {MockERC721Royalty} from "../mocks/MockERC721Royalty.sol";

/**
 * @title NFTMarketplaceRoyaltyTest
 * @notice Fase 5: split fee de protocolo vs royalty ERC-2981 vs seller.
 */
contract NFTMarketplaceRoyaltyTest is Test {
    uint256 internal constant FEE_BPS = 250; // 2.5%
    uint96 internal constant ROYALTY_BPS = 500; // 5%
    uint256 internal constant TOKEN_ID = 1;
    uint256 internal constant PRICE = 1 ether;

    NFTMarketplace internal marketplace;
    MockERC721Royalty internal nftRoyalty;
    MockERC721 internal nftPlain;

    address internal feeRecipient = makeAddr("feeRecipient");
    address internal royaltyReceiver = makeAddr("royaltyReceiver");
    address internal seller = makeAddr("seller");
    address internal buyer = makeAddr("buyer");

    function setUp() public {
        marketplace = new NFTMarketplace(FEE_BPS, feeRecipient);
        nftRoyalty = new MockERC721Royalty("Royalty NFT", "RNFT", royaltyReceiver, ROYALTY_BPS);
        nftPlain = new MockERC721("Plain NFT", "PNFT");

        nftRoyalty.mint(seller, TOKEN_ID);
        nftPlain.mint(seller, TOKEN_ID);
        vm.deal(buyer, 10 ether);
    }

    /**
     * @notice Con ERC-2981: fee + royalty + seller suman el precio y cada uno recibe su parte.
     */
    function test_buyItem_splitsFeeRoyaltyAndSeller() public {
        _listRoyaltyNft();

        uint256 protocolFee = (PRICE * FEE_BPS) / 10_000;
        uint256 royaltyAmount = (PRICE * ROYALTY_BPS) / 10_000;
        uint256 sellerProceeds = PRICE - protocolFee - royaltyAmount;

        (address expectedReceiver, uint256 expectedRoyalty) = nftRoyalty.royaltyInfo(TOKEN_ID, PRICE);
        assertEq(expectedReceiver, royaltyReceiver);
        assertEq(expectedRoyalty, royaltyAmount);

        uint256 sellerBefore = seller.balance;
        uint256 feeBefore = feeRecipient.balance;
        uint256 royaltyBefore = royaltyReceiver.balance;

        vm.prank(buyer);
        marketplace.buyItem{value: PRICE}(address(nftRoyalty), TOKEN_ID);

        assertEq(nftRoyalty.ownerOf(TOKEN_ID), buyer);
        assertEq(feeRecipient.balance - feeBefore, protocolFee);
        assertEq(royaltyReceiver.balance - royaltyBefore, royaltyAmount);
        assertEq(seller.balance - sellerBefore, sellerProceeds);
        assertEq(protocolFee + royaltyAmount + sellerProceeds, PRICE);
    }

    /**
     * @notice Sin IERC2981: el remanente tras el fee va íntegro al seller.
     */
    function test_buyItem_withoutRoyalty_paysSellerNetOfFee() public {
        vm.startPrank(seller);
        nftPlain.approve(address(marketplace), TOKEN_ID);
        marketplace.listItem(address(nftPlain), TOKEN_ID, PRICE);
        vm.stopPrank();

        uint256 protocolFee = (PRICE * FEE_BPS) / 10_000;
        uint256 sellerProceeds = PRICE - protocolFee;

        uint256 sellerBefore = seller.balance;
        uint256 feeBefore = feeRecipient.balance;
        uint256 royaltyBefore = royaltyReceiver.balance;

        vm.prank(buyer);
        marketplace.buyItem{value: PRICE}(address(nftPlain), TOKEN_ID);

        assertEq(nftPlain.ownerOf(TOKEN_ID), buyer);
        assertEq(feeRecipient.balance - feeBefore, protocolFee);
        assertEq(seller.balance - sellerBefore, sellerProceeds);
        assertEq(royaltyReceiver.balance, royaltyBefore, "no royalty paid on plain NFT");
    }

    /**
     * @notice Royalty excesiva se capea al remanente tras el fee (seller = 0).
     */
    function test_buyItem_capsRoyaltyToRemainingAfterFee() public {
        // Royalty 99% + fee 2.5% => royalty se capea a price - fee
        MockERC721Royalty highRoyaltyNft =
            new MockERC721Royalty("High Royalty", "HR", royaltyReceiver, 9900);
        uint256 tokenId = 42;
        highRoyaltyNft.mint(seller, tokenId);

        vm.startPrank(seller);
        highRoyaltyNft.approve(address(marketplace), tokenId);
        marketplace.listItem(address(highRoyaltyNft), tokenId, PRICE);
        vm.stopPrank();

        uint256 protocolFee = (PRICE * FEE_BPS) / 10_000;
        uint256 cappedRoyalty = PRICE - protocolFee;

        uint256 sellerBefore = seller.balance;
        uint256 royaltyBefore = royaltyReceiver.balance;
        uint256 feeBefore = feeRecipient.balance;

        vm.prank(buyer);
        marketplace.buyItem{value: PRICE}(address(highRoyaltyNft), tokenId);

        assertEq(feeRecipient.balance - feeBefore, protocolFee);
        assertEq(royaltyReceiver.balance - royaltyBefore, cappedRoyalty);
        assertEq(seller.balance - sellerBefore, 0);
    }

    /**
     * @notice El mock royalty reporta soporte IERC2981.
     */
    function test_mockRoyalty_supportsIERC2981() public view {
        assertTrue(nftRoyalty.supportsInterface(type(IERC2981).interfaceId));
        assertFalse(nftPlain.supportsInterface(type(IERC2981).interfaceId));
    }

    function _listRoyaltyNft() internal {
        vm.startPrank(seller);
        nftRoyalty.approve(address(marketplace), TOKEN_ID);
        marketplace.listItem(address(nftRoyalty), TOKEN_ID, PRICE);
        vm.stopPrank();
    }
}
