// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.20; // using a more common version range

contract TierList {
    address public immutable owner;
    uint256 private nextTierListId = 1;

    // submissions[tlId][i] = voter address at submission index i (0-based)
    mapping(uint256 => address[]) private submissions;
    mapping(uint256 => uint256) public submissionsNextIndex; // == submissions[tlId].length

    uint256 public constant NUM_TIERS = 5;

    // ──────────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ──────────────────────────────────────────────────────────────────────────────

    event TierListCreated(
        uint256 indexed tierListId,
        string name,
        string description,
        uint256 numActiveItems
    );
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

    event RankingSubmitted(
        address indexed voter,
        uint256 indexed tierListId,
        uint256 submissionIndex
    );

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

    struct TierListView {
        uint256 id;
        string name;
        string description;
        bool active;
        uint256 numActiveItems;
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

    // userVotes[tlId][user][rank] = ordered array of itemIds in that rank (rank: 0..NUM_TIERS-1)
    mapping(uint256 => mapping(address => mapping(uint256 => uint256[])))
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

        emit TierListCreated(tlId, name, description, initialItemNames.length);

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
        uint256[][] calldata rankedItemIdsByTier
    ) external tierListMustExist(tlId) tierListActive(tlId) {
        require(rankedItemIdsByTier.length == NUM_TIERS, "Invalid tiers");

        // Require at least one ranked item total (any tier non-empty)
        bool hasAny = false;
        for (uint256 t = 0; t < NUM_TIERS; t++) {
            if (rankedItemIdsByTier[t].length > 0) {
                hasAny = true;
                break;
            }
        }
        require(hasAny, "Empty ranking");

        // 1) Clear existing ranking (decrement aggregates)
        for (uint256 t = 0; t < NUM_TIERS; t++) {
            uint256[] storage prevArr = userVotes[tlId][msg.sender][t];

            for (uint256 i = 0; i < prevArr.length; i++) {
                uint256 itemId = prevArr[i];

                // If item is still active, it still contributes to voteCounts.
                // If removed, removeItem() already zeroed voteCounts for it.
                if (items[tlId][itemId].active) {
                    voteCounts[tlId][itemId][t]--;
                }
            }

            delete userVotes[tlId][msg.sender][t];
        }

        // 2) Set new ranking (increment aggregates + preserve order)
        for (uint256 t = 0; t < NUM_TIERS; t++) {
            uint256[] calldata arr = rankedItemIdsByTier[t];

            // copy calldata -> storage, keep order
            for (uint256 i = 0; i < arr.length; i++) {
                uint256 itemId = arr[i];

                require(items[tlId][itemId].active, "Item removed");
                // NOTE: no duplicate protection; duplicates will overcount.
                // If you want strict uniqueness across tiers, say so and I’ll add it.

                userVotes[tlId][msg.sender][t].push(itemId);
                voteCounts[tlId][itemId][t]++;
            }
        }

        submissions[tlId].push(msg.sender);
        submissionsNextIndex[tlId] = submissions[tlId].length;

        emit RankingSubmitted(msg.sender, tlId, submissions[tlId].length - 1);
    }

    function _revertIfDuplicateIds(
        uint256[][] calldata rankedItemIdsByTier
    ) internal pure {
        for (uint256 t1 = 0; t1 < NUM_TIERS; t1++) {
            uint256[] calldata a = rankedItemIdsByTier[t1];
            for (uint256 i = 0; i < a.length; i++) {
                uint256 id = a[i];

                // within same tier
                for (uint256 j = i + 1; j < a.length; j++) {
                    require(a[j] != id, "Duplicate item");
                }

                // across later tiers
                for (uint256 t2 = t1 + 1; t2 < NUM_TIERS; t2++) {
                    uint256[] calldata b = rankedItemIdsByTier[t2];
                    for (uint256 k = 0; k < b.length; k++) {
                        require(b[k] != id, "Duplicate item");
                    }
                }
            }
        }
    }

    function deleteRanking(
        uint256 tlId
    ) external tierListMustExist(tlId) tierListActive(tlId) {
        for (uint256 t = 0; t < NUM_TIERS; t++) {
            uint256[] storage prevArr = userVotes[tlId][msg.sender][t];

            for (uint256 i = 0; i < prevArr.length; i++) {
                uint256 itemId = prevArr[i];

                if (items[tlId][itemId].active) {
                    voteCounts[tlId][itemId][t]--;
                }
            }

            delete userVotes[tlId][msg.sender][t];
        }

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
    ) external view returns (TierListView[] memory) {
        uint256 count = 0;
        for (uint256 id = 1; id < nextTierListId; id++) {
            if (includeInactive || tierListInfos[id].active) count++;
        }

        TierListView[] memory lists = new TierListView[](count);
        uint256 idx = 0;

        for (uint256 id = 1; id < nextTierListId && idx < count; id++) {
            TierListInfo storage info = tierListInfos[id];
            if (includeInactive || info.active) {
                lists[idx] = TierListView({
                    id: id,
                    name: info.name,
                    description: info.description,
                    active: info.active,
                    numActiveItems: info.numActiveItems
                });
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
        returns (
            string memory name,
            string memory description,
            bool active,
            uint256 numActiveItems
        )
    {
        TierListInfo memory info = tierListInfos[tlId];
        return (info.name, info.description, info.active, info.numActiveItems);
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
        returns (uint256[][] memory rankedItemIdsByTier)
    {
        rankedItemIdsByTier = new uint256[][](NUM_TIERS);

        for (uint256 t = 0; t < NUM_TIERS; t++) {
            uint256[] storage arr = userVotes[tlId][user][t];
            uint256[] memory out = new uint256[](arr.length);

            for (uint256 i = 0; i < arr.length; i++) {
                out[i] = arr[i];
            }

            rankedItemIdsByTier[t] = out;
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

    function getSubmissionsNextIndex(
        uint256 tlId
    ) external view tierListMustExist(tlId) returns (uint256) {
        return submissions[tlId].length;
    }

    function getLatestSubmissions(
        uint256 tlId,
        uint256 limit,
        uint256 offset
    )
        external
        view
        tierListMustExist(tlId)
        returns (address[] memory accounts)
    {
        // offset=0 => start from latest
        // returns up to `limit` accounts, newest -> older

        uint256 n = submissions[tlId].length;
        if (n == 0 || limit == 0) return new address[](0);

        // start is exclusive upper bound index in [0..n]
        // start = n - offset
        if (offset >= n) return new address[](0);

        uint256 start = n - offset; // 1..n
        uint256 available = start; // indices [0 .. start-1]
        uint256 size = limit < available ? limit : available;

        accounts = new address[](size);

        // fill newest -> older
        for (uint256 i = 0; i < size; i++) {
            accounts[i] = submissions[tlId][start - 1 - i];
        }
    }
}
