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

    // Packs the legacy (itemIds, tiers) representation into the new
    // rankedItemIdsByTier shape expected by submitRanking().
    function _packRanking(
        uint256[] memory itemIds,
        uint256[] memory tiers
    ) internal pure returns (uint256[][] memory ranked) {
        ranked = new uint256[][](5);

        for (uint256 i = 0; i < itemIds.length; i++) {
            uint256 t = tiers[i];
            require(t < 5, "tier oob");

            uint256[] memory oldArr = ranked[t];
            uint256[] memory newArr = new uint256[](oldArr.length + 1);

            for (uint256 j = 0; j < oldArr.length; j++) {
                newArr[j] = oldArr[j];
            }
            newArr[oldArr.length] = itemIds[i];

            ranked[t] = newArr;
        }
    }

    function _contains(
        uint256[] memory arr,
        uint256 v
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == v) return true;
        }
        return false;
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

        uint256[][] memory ranked = _packRanking(itemIds, tiers);
        tl.submitRanking(1, ranked);

        uint256[][] memory userRanked = tl.getUserVotes(1, address(this));
        assert(userRanked.length == 5);
        assert(userRanked[4].length == 1);
        assert(userRanked[1].length == 1);
        assert(userRanked[4][0] == 1);
        assert(userRanked[1][0] == 2);

        uint256[] memory countsItem1 = tl.getItemVoteCounts(1, 1);
        assert(countsItem1[4] == 1);

        uint256[] memory updateItemIds = new uint256[](1);
        uint256[] memory updateTiers = new uint256[](1);
        updateItemIds[0] = 1;
        updateTiers[0] = 2;

        ranked = _packRanking(updateItemIds, updateTiers);
        tl.submitRanking(1, ranked);

        countsItem1 = tl.getItemVoteCounts(1, 1);
        assert(countsItem1[4] == 0);
        assert(countsItem1[2] == 1);

        // and item 2 vote should have been cleared by full replacement
        uint256[] memory countsItem2 = tl.getItemVoteCounts(1, 2);
        assert(countsItem2[1] == 0);
    }

    function testRemoveItemMarksInactiveAndClearsVotes() external {
        TierList tl = new TierList();
        _createListWithTwoItems(tl);

        uint256[] memory itemIds = new uint256[](1);
        uint256[] memory tiers = new uint256[](1);
        itemIds[0] = 1;
        tiers[0] = 3;

        uint256[][] memory ranked = _packRanking(itemIds, tiers);
        tl.submitRanking(1, ranked);

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

        uint256[][] memory ranked = _packRanking(itemIds, tiers);

        (bool ok, ) = address(tl).call(
            abi.encodeWithSelector(tl.submitRanking.selector, 1, ranked)
        );
        assert(!ok);
    }
}
