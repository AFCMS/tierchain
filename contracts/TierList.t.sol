// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.28;

import "./TierList.sol";

contract TierListActor {
    function tryCreateTierList(
        TierList tl,
        string memory name,
        string memory description,
        string[] memory itemNames
    ) external returns (bool) {
        (bool ok, ) = address(tl).call(
            abi.encodeWithSelector(
                tl.createTierList.selector,
                name,
                description,
                itemNames
            )
        );
        return ok;
    }
}

contract TierListTest {
    function _assertStringEq(string memory a, string memory b) internal pure {
        assert(keccak256(bytes(a)) == keccak256(bytes(b)));
    }

    function _createListWithTwoItems(TierList tl) internal {
        string[] memory items = new string[](2);
        items[0] = "Item A";
        items[1] = "Item B";
        tl.createTierList("My List", "desc", items);
    }

    function testOwnerIsDeployer() external {
        TierList tl = new TierList();
        assert(tl.owner() == address(this));
    }

    function testCreateTierListStoresData() external {
        TierList tl = new TierList();

        string[] memory items = new string[](0);
        tl.createTierList("Movies", "Ranking movies", items);

        assert(tl.getTotalTierLists() == 1);

        (
            string memory name,
            string memory description,
            bool active,
            uint256 numActiveItems
        ) = tl.tierListInfos(1);

        _assertStringEq(name, "Movies");
        _assertStringEq(description, "Ranking movies");
        assert(active);
        assert(numActiveItems == 0);
    }

    function testOnlyOwnerCanCreateTierList() external {
        TierList tl = new TierList();
        TierListActor actor = new TierListActor();

        string[] memory items = new string[](1);
        items[0] = "Unauthorized";

        bool ok = actor.tryCreateTierList(tl, "Hack", "Nope", items);
        assert(!ok);
        assert(tl.getTotalTierLists() == 0);
    }

    function testGetTierListItemsReturnsIdsAndInfos() external {
        TierList tl = new TierList();
        _createListWithTwoItems(tl);

        (uint256[] memory itemIds, TierList.ItemInfo[] memory itemInfos) = tl
            .getTierListItems(1);

        assert(itemIds.length == 2);
        assert(itemInfos.length == 2);

        assert(itemIds[0] == 1);
        assert(itemIds[1] == 2);
        _assertStringEq(itemInfos[0].name, "Item A");
        _assertStringEq(itemInfos[1].name, "Item B");
        assert(itemInfos[0].active);
        assert(itemInfos[1].active);
    }

    function testSubmitRankingTracksAndReplacesVotes() external {
        TierList tl = new TierList();
        _createListWithTwoItems(tl);

        uint256[] memory itemIds = new uint256[](2);
        uint256[] memory tiers = new uint256[](2);
        itemIds[0] = 1;
        itemIds[1] = 2;
        tiers[0] = 4;
        tiers[1] = 1;

        tl.submitRanking(1, itemIds, tiers);

        (uint256[] memory userItemIds, uint256[] memory userTiers) = tl
            .getUserVotes(1, address(this));
        assert(userItemIds.length == 2);
        assert(userTiers.length == 2);
        assert(userItemIds[0] == 1);
        assert(userTiers[0] == 4);
        assert(userItemIds[1] == 2);
        assert(userTiers[1] == 1);

        uint256[] memory countsItem1 = tl.getItemVoteCounts(1, 1);
        assert(countsItem1[4] == 1);

        uint256[] memory updateItemIds = new uint256[](1);
        uint256[] memory updateTiers = new uint256[](1);
        updateItemIds[0] = 1;
        updateTiers[0] = 2;

        tl.submitRanking(1, updateItemIds, updateTiers);

        countsItem1 = tl.getItemVoteCounts(1, 1);
        assert(countsItem1[4] == 0);
        assert(countsItem1[2] == 1);
    }

    function testRemoveItemMarksInactiveAndClearsVotes() external {
        TierList tl = new TierList();
        _createListWithTwoItems(tl);

        uint256[] memory itemIds = new uint256[](1);
        uint256[] memory tiers = new uint256[](1);
        itemIds[0] = 1;
        tiers[0] = 3;
        tl.submitRanking(1, itemIds, tiers);

        tl.removeItem(1, 1);

        (uint256[] memory ids, TierList.ItemInfo[] memory infos) = tl
            .getTierListItems(1);
        assert(ids.length == 2);
        assert(infos.length == 2);
        assert(ids[0] == 1);
        assert(!infos[0].active);

        uint256[] memory counts = tl.getItemVoteCounts(1, 1);
        for (uint256 i = 0; i < tl.NUM_TIERS(); i++) {
            assert(counts[i] == 0);
        }
    }

    function testSubmitRankingRevertsOnInvalidTier() external {
        TierList tl = new TierList();
        _createListWithTwoItems(tl);

        uint256[] memory itemIds = new uint256[](1);
        uint256[] memory tiers = new uint256[](1);
        itemIds[0] = 1;
        tiers[0] = 5;

        (bool ok, ) = address(tl).call(
            abi.encodeWithSelector(tl.submitRanking.selector, 1, itemIds, tiers)
        );
        assert(!ok);
    }
}
