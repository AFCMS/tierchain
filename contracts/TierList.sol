// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.20; // using a more common version range

contract TierList {
    address public immutable owner;
    uint256 private nextTierListId = 1;

    uint256 public constant NUM_TIERS = 5;

    // ──────────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ──────────────────────────────────────────────────────────────────────────────

    event TierListCreated(uint256 indexed tierListId, string name);
    event TierListStatusChanged(uint256 indexed tierListId, bool active);
    event ItemsAdded(
        uint256 indexed tierListId,
        uint256[] itemIds,
        string[] names
    );
    event ItemRemoved(
        uint256 indexed tierListId,
        uint256 indexed itemId,
        string name
    );

    event RankingSubmitted(address indexed voter, uint256 indexed tierListId);
    event RankingDeleted(address indexed voter, uint256 indexed tierListId);

    // ──────────────────────────────────────────────────────────────────────────────
    // DATA STRUCTURES
    // ──────────────────────────────────────────────────────────────────────────────
    //
    // This contract uses mappings as "sparse arrays".
    // Key point: mappings are NOT enumerable on-chain.
    // That means:
    //  - you can read/write userVotes[tlId][user][itemId] in O(1)
    //  - but you cannot iterate "all itemIds a user voted on" unless you store an index/list separately.
    //
    // As a result, view functions like getTierListItems() and getUserVotes() rebuild arrays by scanning
    // from 1..tierListNextItemId[tlId]. That scan is OK in view calls (off-chain), but can be too expensive
    // for state-changing functions if the tier list grows large.

    struct TierListInfo {
        string name;
        string description;
        bool active;
        uint256 numActiveItems; // number of items with items[tlId][id].active == true
    }

    mapping(uint256 => TierListInfo) public tierListInfos;

    // For each tier list, item IDs are assigned incrementally starting at 1.
    // This is a monotonically increasing counter; it does NOT decrease when items are removed.
    // So the "max item id ever assigned" for a tier list is tierListNextItemId[tlId].
    mapping(uint256 => uint256) public tierListNextItemId;

    struct ItemInfo {
        string name;
        bool active; // true = item is votable, false = removed/disabled
    }

    // items[tlId][itemId] holds item metadata.
    // Note: this mapping is also sparse; an item "exists" if bytes(items[tlId][itemId].name).length > 0.
    mapping(uint256 => mapping(uint256 => ItemInfo)) public items;

    // Redundant storage of item name by id; used when emitting ItemRemoved with the name.
    mapping(uint256 => mapping(uint256 => string)) private itemIdToName;

    // Used to enforce uniqueness of item names within a tier list.
    // When an item is removed, this is set back to false so the name can be reused.
    mapping(uint256 => mapping(string => bool)) private itemNameUsed;

    // voteCounts[tlId][itemId][tier] = total number of votes from ALL users
    // that currently place itemId into 'tier' (tier is 0..NUM_TIERS-1).
    //
    // This is the "global aggregate" used for displaying results without iterating over all users.
    mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256)))
        public voteCounts;

    // Enumerability helpers:
    // userVotedItemIds[tlId][user] = list of itemIds this user has EVER voted on (and not yet deleted).
    // userVotedItemIndexPlus1[tlId][user][itemId] = index in userVotedItemIds + 1, so 0 means "not present".
    mapping(uint256 => mapping(address => uint256[])) private userVotedItemIds;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256)))
        private userVotedItemIndexPlus1;

    // userVotes[tlId][user][itemId] = the tier that THIS user assigned to this item.
    //
    // Stored as tier+1 so that 0 can mean "no vote exists":
    //   0 => user has not voted on this item
    //   1 => user voted tier 0
    //   2 => user voted tier 1
    //   ...
    //   NUM_TIERS => user voted tier NUM_TIERS-1
    //
    // This enables "replace vote": on submitRanking we can look up the previous value and decrement
    // the old voteCounts bucket, then increment the new one.
    //
    // Limitation: because this is a mapping, we do NOT store a list of itemIds a user voted on.
    // So deleting "all votes by a user" requires either:
    //   - scanning 1..tierListNextItemId[tlId] (can be expensive), OR
    //   - having the caller provide the itemIds to clear, OR
    //   - adding extra indexing storage (user -> array/set of voted itemIds).
    mapping(uint256 => mapping(address => mapping(uint256 => uint256)))
        private userVotes;

    // ──────────────────────────────────────────────────────────────────────────────
    // SETUP & MODIFIERS
    // ──────────────────────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier tierListMustExist(uint256 tlId) {
        require(
            bytes(tierListInfos[tlId].name).length > 0,
            "TierList does not exist"
        );
        _;
    }

    modifier tierListActive(uint256 tlId) {
        require(tierListInfos[tlId].active, "TierList is disabled");
        _;
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // OWNER FUNCTIONS
    // ──────────────────────────────────────────────────────────────────────────────

    function createTierList(
        string calldata name,
        string calldata description,
        string[] calldata initialItemNames
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name cannot be empty");

        uint256 tlId = nextTierListId++;
        tierListInfos[tlId] = TierListInfo({
            name: name,
            description: description,
            active: true,
            numActiveItems: 0
        });

        emit TierListCreated(tlId, name);

        if (initialItemNames.length > 0) {
            _addItems(tlId, initialItemNames);
        }
    }

    function setTierListActive(
        uint256 tlId,
        bool active
    ) external onlyOwner tierListMustExist(tlId) {
        tierListInfos[tlId].active = active;
        emit TierListStatusChanged(tlId, active);
    }

    function addItem(
        uint256 tlId,
        string[] calldata names
    ) external onlyOwner tierListMustExist(tlId) tierListActive(tlId) {
        require(names.length > 0, "No items provided");
        _addItems(tlId, names);
    }

    function _addItems(uint256 tlId, string[] calldata names) internal {
        uint256[] memory newIds = new uint256[](names.length);

        for (uint256 i = 0; i < names.length; i++) {
            string calldata n = names[i];
            require(bytes(n).length > 0, "Empty name");
            require(!itemNameUsed[tlId][n], "Name already used");

            uint256 itemId = ++tierListNextItemId[tlId];
            items[tlId][itemId] = ItemInfo({name: n, active: true});
            itemIdToName[tlId][itemId] = n;
            itemNameUsed[tlId][n] = true;
            tierListInfos[tlId].numActiveItems++;

            newIds[i] = itemId;
        }

        emit ItemsAdded(tlId, newIds, names);
    }

    function removeItem(
        uint256 tlId,
        uint256 itemId
    ) external onlyOwner tierListMustExist(tlId) tierListActive(tlId) {
        ItemInfo storage item = items[tlId][itemId];
        require(item.active, "Item already removed or doesn't exist");

        string memory name = itemIdToName[tlId][itemId];

        itemNameUsed[tlId][name] = false;
        item.active = false;
        tierListInfos[tlId].numActiveItems--;

        for (uint256 t = 0; t < NUM_TIERS; t++) {
            voteCounts[tlId][itemId][t] = 0;
        }

        emit ItemRemoved(tlId, itemId, name);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // USER FUNCTIONS
    // ──────────────────────────────────────────────────────────────────────────────

    function submitRanking(
        uint256 tlId,
        uint256[] calldata itemIds,
        uint256[] calldata tierIndices
    ) external tierListMustExist(tlId) tierListActive(tlId) {
        require(
            itemIds.length == tierIndices.length && itemIds.length > 0,
            "Invalid input"
        );

        for (uint256 i = 0; i < itemIds.length; i++) {
            uint256 itemId = itemIds[i];
            uint256 tier = tierIndices[i];

            require(tier < NUM_TIERS, "Tier must be 0-4");
            require(items[tlId][itemId].active, "Item removed");

            uint256 prev = userVotes[tlId][msg.sender][itemId];
            if (prev > 0) {
                voteCounts[tlId][itemId][prev - 1]--;
            }

            // If this is the first time this user interacts with this item, index it so we can enumerate later.
            if (userVotedItemIndexPlus1[tlId][msg.sender][itemId] == 0) {
                userVotedItemIds[tlId][msg.sender].push(itemId);
                userVotedItemIndexPlus1[tlId][msg.sender][
                    itemId
                ] = userVotedItemIds[tlId][msg.sender].length; // index+1
            }

            voteCounts[tlId][itemId][tier]++;
            userVotes[tlId][msg.sender][itemId] = tier + 1;
        }

        emit RankingSubmitted(msg.sender, tlId);
    }

    function deleteRanking(
        uint256 tlId
    ) external tierListMustExist(tlId) tierListActive(tlId) {
        uint256[] storage votedIds = userVotedItemIds[tlId][msg.sender];

        // Iterate and clear votes
        for (uint256 i = 0; i < votedIds.length; i++) {
            uint256 itemId = votedIds[i];

            uint256 prev = userVotes[tlId][msg.sender][itemId]; // tier+1
            if (prev > 0) {
                // If the item is still active, it still contributes to voteCounts.
                // If it was removed, removeItem() already zeroed voteCounts for it.
                if (items[tlId][itemId].active) {
                    voteCounts[tlId][itemId][prev - 1]--;
                }
                delete userVotes[tlId][msg.sender][itemId];
            }

            delete userVotedItemIndexPlus1[tlId][msg.sender][itemId];
        }

        // Clear the list itself
        delete userVotedItemIds[tlId][msg.sender];

        emit RankingDeleted(msg.sender, tlId);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // VIEW FUNCTIONS
    // ──────────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns basic info of all tier lists (id, name, active)
     */
    function getTierLists(
        bool includeInactive
    ) external view returns (TierListInfo[] memory) {
        uint256 count = 0;
        for (uint256 id = 1; id < nextTierListId; id++) {
            if (includeInactive || tierListInfos[id].active) count++;
        }

        TierListInfo[] memory lists = new TierListInfo[](count);
        uint256 idx = 0;
        for (uint256 id = 1; id < nextTierListId && idx < count; id++) {
            if (includeInactive || tierListInfos[id].active) {
                lists[idx] = tierListInfos[id];
                idx++;
            }
        }
        return lists;
    }

    /**
     * @notice Returns basic info of a specific tier list (id, name, active)
     */
    function getTierList(
        uint256 tlId
    )
        external
        view
        tierListMustExist(tlId)
        returns (string memory name, bool active, uint256 numActiveItems)
    {
        TierListInfo memory info = tierListInfos[tlId];
        return (info.name, info.active, info.numActiveItems);
    }

    /**
     * @notice Get all items of a tier list (id, name, active)
     */
    function getTierListItems(
        uint256 tlId
    )
        external
        view
        tierListMustExist(tlId)
        returns (uint256[] memory itemIds, ItemInfo[] memory itemInfos)
    {
        uint256 maxItemId = tierListNextItemId[tlId];
        uint256 count = 0;

        for (uint256 id = 1; id <= maxItemId; id++) {
            if (bytes(items[tlId][id].name).length > 0) count++;
        }

        itemIds = new uint256[](count);
        itemInfos = new ItemInfo[](count);

        uint256 idx = 0;
        for (uint256 id = 1; id <= maxItemId && idx < count; id++) {
            ItemInfo memory info = items[tlId][id];
            if (bytes(info.name).length > 0) {
                itemIds[idx] = id;
                itemInfos[idx] = info;
                idx++;
            }
        }
    }

    /**
     * @notice Get the votes of a user for a specific tier list
     */
    function getUserVotes(
        uint256 tlId,
        address user
    )
        external
        view
        tierListMustExist(tlId)
        returns (uint256[] memory itemIds, uint256[] memory tiers)
    {
        uint256 maxItemId = tierListNextItemId[tlId];
        uint256 count = 0;

        for (uint256 id = 1; id <= maxItemId; id++) {
            if (userVotes[tlId][user][id] > 0) count++;
        }

        itemIds = new uint256[](count);
        tiers = new uint256[](count);

        uint256 idx = 0;
        for (uint256 id = 1; id <= maxItemId && idx < count; id++) {
            uint256 stored = userVotes[tlId][user][id];
            if (stored > 0) {
                itemIds[idx] = id;
                tiers[idx] = stored - 1;
                idx++;
            }
        }
    }

    /**
     * @notice Get the global vote counts for a specific tier list
     * @param tlId TierList ID
     * @return itemIds - array of active item IDs in the tier list
     * @return counts - a 2D array where counts[i][t] is the number of votes for itemIds[i] in tier t (0-4)
     */
    function getGlobalVotes(
        uint256 tlId
    )
        external
        view
        tierListMustExist(tlId)
        returns (uint256[] memory itemIds, uint256[][] memory counts)
    {
        uint256 maxItemId = tierListNextItemId[tlId];
        uint256 count = 0;

        for (uint256 id = 1; id <= maxItemId; id++) {
            if (items[tlId][id].active) count++;
        }

        itemIds = new uint256[](count);
        counts = new uint256[][](count);

        uint256 idx = 0;
        for (uint256 id = 1; id <= maxItemId && idx < count; id++) {
            if (items[tlId][id].active) {
                itemIds[idx] = id;
                counts[idx] = new uint256[](NUM_TIERS);
                for (uint256 t = 0; t < NUM_TIERS; t++) {
                    counts[idx][t] = voteCounts[tlId][id][t];
                }
                idx++;
            }
        }
    }

    /**
     * @notice Get the vote counts for a specific item in a tier list
     * @param tlId TierList ID
     * @param itemId Item ID
     * @return counts - array of vote counts for each tier (0-4)
     */
    function getItemVoteCounts(
        uint256 tlId,
        uint256 itemId
    ) external view tierListMustExist(tlId) returns (uint256[] memory counts) {
        require(
            bytes(items[tlId][itemId].name).length > 0,
            "Item does not exist"
        );

        counts = new uint256[](NUM_TIERS);
        if (!items[tlId][itemId].active) return counts;

        for (uint256 i = 0; i < NUM_TIERS; i++) {
            counts[i] = voteCounts[tlId][itemId][i];
        }
    }

    function getTotalTierLists() external view returns (uint256) {
        return nextTierListId - 1;
    }

    function tierListExists(uint256 tlId) external view returns (bool) {
        return bytes(tierListInfos[tlId].name).length > 0;
    }
}
