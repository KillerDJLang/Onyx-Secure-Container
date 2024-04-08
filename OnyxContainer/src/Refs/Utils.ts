import { Item }                         from "@spt-aki/models/eft/common/tables/IItem";
import { IBarterScheme, ITrader }       from "@spt-aki/models/eft/common/tables/ITrader";
import { ILogger }                      from "@spt-aki/models/spt/utils/ILogger";
import { HashUtil }                     from "@spt-aki/utils/HashUtil";
import { Currency }                     from "../Refs/Enums";

export class Utils
{
    constructor() 
    {}

    public randomCount ( base: number, random: number ): number
    {
        return ( base + Math.floor( Math.random() * random * 2 ) - random )
    }

    public addToCases(tables, caseToAdd, itemToAdd)
    {
        const items = tables.templates.items

        for (let item in items) 
        {
            if (items[item]._id === caseToAdd)
            {
                if (items[item]._props?.Grids[0]._props.filters[0].Filter !== null)
                {
                    items[item]._props?.Grids[0]._props.filters[0].Filter.push(itemToAdd)
                }
            }
        }
    }

    public stopHurtingMeSVM(tables, caseToAdd)
    {
        const unbreakFilters = [
            {
                "Filter": ["54009119af1c881c07000029"],
                "ExcludedFilter": [""]
            }
        ];
        
        tables.templates.items[caseToAdd]._props.Grids[0]._props.filters = unbreakFilters;
    }

    public createGrid(hashUtil, id, config, modName, logger) 
    {
        const grids = [];
        const itemID = id
        let cellHeight = config.InternalSize["CellsV"];
        let cellWidth = config.InternalSize["CellsH"];

        //if number of width and height cells are not the same, set case to 1x1 and throw warning
        if (cellHeight.length !== cellWidth.length)
        {
            cellHeight = [1];
            cellWidth = [1];
            logger.log(`[${modName}] : WARNING: number of internal and vertical cells must be the same.`, "red");
            logger.log(`[${modName}] : WARNING: setting Onyx Container to be 1 1x1 cell.`, "red");

        }

        for (let i = 0; i < cellWidth.length; i++) 
        {
            {
                grids.push(this.generateColumn(hashUtil, itemID, "column"+i, cellWidth[i], cellHeight[i]));
            }
        }
        return grids;
    }


    public generateColumn(hashUtil, itemID, name, cellH, cellV) 
    {
        return {
            "_name": name,
            "_id": hashUtil.generate(),
            "_parent": itemID,
            "_props": {
                "filters": [
                    {
                        "Filter": ["54009119af1c881c07000029"],
                        "ExcludedFilter": [""]
                    }
                ],
                "cellsH": cellH,
                "cellsV": cellV,
                "minCount": 0,
                "maxCount": 0,
                "maxWeight": 0,
                "isSortingTable": false
            }
        };
    }

    public createCase(itemToClone, newID,  tables, jsonUtil, newGrids, handBookParent, handBookPrice, localeName, localeShortName, localeDescription)
    {
        const handbook = tables.templates.handbook;
        const locales = Object.values(tables.locales.global) as Record<string, string>[];
        const itemID = newID;
        let item: any;

        item = jsonUtil.clone(tables.templates.items[itemToClone]);

        item._id = itemID;

        item._props.Grids = newGrids

        tables.templates.items[itemID] = item;
        
        //add locales
        for (const locale of locales) {
            locale[`${itemID} Name`] = localeName;
            locale[`${itemID} ShortName`] = localeShortName;
            locale[`${itemID} Description`] = localeDescription;
        }

        handbook.Items.push(
            {
                Id: itemID,
                ParentId: handBookParent,
                Price: handBookPrice
            }
        );
    }
}

//
//
//

export interface AssortTemplate 
{
    items: [
        {
          _id: string,
          _tpl: string,
          parentId: string,
          slotId: string,
          upd: {
            StackObjectsCount: number,
            UnlimitedCount: boolean
          }
        }
    ],
    barter_scheme: {
        [itemid: string]: [
          [
            {
              _tpl: string,
              count: number
            }
          ]
        ]
    },
    loyal_level_items: {
        [itemid: string]: number
    }
}

//
//
//

export class AssortUtils
{
    protected itemsToSell: Item[] = [];
    protected barterScheme: Record<string, IBarterScheme[][]> = {};
    protected loyaltyLevel: Record<string, number> = {};
    protected hashUtil: HashUtil;
    protected logger: ILogger;

    constructor(hashutil: HashUtil, logger: ILogger)
    {
        this.hashUtil = hashutil
        this.logger = logger;
    }
    
    /**
     * Start selling item with tpl
     * @param itemTpl Tpl id of the item you want trader to sell 
     * @param itemId Optional - set your own Id, otherwise unique id will be generated
     */
    public createSingleAssortItem(itemTpl: string, itemId = undefined): AssortUtils
    {
        // Create item ready for insertion into assort table
        const newItemToAdd: Item = {
            _id: !itemId ? this.hashUtil.generate(): itemId,
            _tpl: itemTpl,
            parentId: "hideout", // Should always be "hideout"
            slotId: "hideout", // Should always be "hideout"
            upd: {
                UnlimitedCount: false,
                StackObjectsCount: 100
            }
        };

        this.itemsToSell.push(newItemToAdd);

        return this;
    }

    public createComplexAssortItem(items: Item[]): AssortUtils
    {
        items[0].parentId = "hideout";
        items[0].slotId = "hideout";

        if (!items[0].upd)
        {
            items[0].upd = {}
        }

        items[0].upd.UnlimitedCount = false;
        items[0].upd.StackObjectsCount = 100;

        this.itemsToSell.push(...items);

        return this;
    }

    public addStackCount(stackCount: number): AssortUtils
    {
        this.itemsToSell[0].upd.StackObjectsCount = stackCount;

        return this;
    }

    public addUnlimitedStackCount(): AssortUtils
    {
        this.itemsToSell[0].upd.StackObjectsCount = 999999;
        this.itemsToSell[0].upd.UnlimitedCount = true;

        return this;
    }

    public makeStackCountUnlimited(): AssortUtils
    {
        this.itemsToSell[0].upd.StackObjectsCount = 999999;

        return this;
    }

    public addBuyRestriction(maxBuyLimit: number): AssortUtils
    {
        this.itemsToSell[0].upd.BuyRestrictionMax = maxBuyLimit;
        this.itemsToSell[0].upd.BuyRestrictionCurrent = 0;

        return this;
    }

    public addLoyaltyLevel(level: number)
    {
        this.loyaltyLevel[this.itemsToSell[0]._id] = level;

        return this;
    }

    public addMoneyCost(currencyType: Currency, amount: number): AssortUtils
    {
        this.barterScheme[this.itemsToSell[0]._id] = [
            [
                {
                    count: amount,
                    _tpl: currencyType
                }
            ]
        ];

        return this;
    }

    public addBarterCost(itemTpl: string, count: number): AssortUtils
    {
        const sellableItemId = this.itemsToSell[0]._id;

        // No data at all, create
        if (Object.keys(this.barterScheme).length === 0)
        {
            this.barterScheme[sellableItemId] = [[
                {
                    count: count,
                    _tpl: itemTpl
                }
            ]];
        }
        else
        {
            // Item already exists, add to
            const existingData = this.barterScheme[sellableItemId][0].find(x => x._tpl === itemTpl);
            if (existingData)
            {
                // itemtpl already a barter for item, add to count
                existingData.count+= count;
            }
            else
            {
                // No barter for item, add it fresh
                this.barterScheme[sellableItemId][0].push({
                    count: count,
                    _tpl: itemTpl
                })
            }
            
        }

        return this;
    }

    /**
     * Reset object ready for reuse
     * @returns 
     */
    public export(data: ITrader, blockDupes: boolean): AssortUtils
    {
        const itemBeingSoldId  = this.itemsToSell[0]._id;
        const itemBeingSoldTpl = this.itemsToSell[0]._tpl;
        if (blockDupes)
        {
            if (data.assort.items.find(x => x._id === itemBeingSoldId))
            {
                return;
            }

            if (data.assort.items.find(x => x._tpl === itemBeingSoldTpl))
            {
                return;
            }
        }

        data.assort.items.push(...this.itemsToSell);
        data.assort.barter_scheme[itemBeingSoldId] = this.barterScheme[itemBeingSoldId];
        data.assort.loyal_level_items[itemBeingSoldId] = this.loyaltyLevel[itemBeingSoldId];

        this.itemsToSell = [];
        this.barterScheme = {};
        this.loyaltyLevel = {};

        return this;
    }

    public pushFromTraderAssort(items: Item[], itemTpl: string, count: number, stackCount: number, level: number, data: ITrader, blockDupes: boolean, )
    {
        items[0].parentId = "hideout";
        items[0].slotId = "hideout";

        if (!items[0].upd)
        {
            items[0].upd = {}
        }

        items[0].upd.UnlimitedCount = false;
        items[0].upd.StackObjectsCount = 100;

        this.itemsToSell.push(...items);

        const sellableItemId = this.itemsToSell[0]._id;

        // No data at all, create
        if (Object.keys(this.barterScheme).length === 0)
        {
            this.barterScheme[sellableItemId] = [[
                {
                    count: count,
                    _tpl: itemTpl
                }
            ]];
        }

        else
        {
            // Item already exists, add to
            const existingData = this.barterScheme[sellableItemId][0].find(x => x._tpl === itemTpl);
            if (existingData)
            {
                // itemtpl already a barter for item, add to count
                existingData.count+= count;
            }
            else
            {
                // No barter for item, add it fresh
                this.barterScheme[sellableItemId][0].push({
                    count: count,
                    _tpl: itemTpl
                })
            }          
        }
       
        this.itemsToSell[0].upd.StackObjectsCount = stackCount;
        
        this.loyaltyLevel[this.itemsToSell[0]._id] = level;

        const itemBeingSoldId  = this.itemsToSell[0]._id;
        const itemBeingSoldTpl = this.itemsToSell[0]._tpl;
        if (blockDupes)
        {
            if (data.assort.items.find(x => x._id === itemBeingSoldId))
            {
                return;
            }

            if (data.assort.items.find(x => x._tpl === itemBeingSoldTpl))
            {
                return;
            }
        }

        data.assort.items.push(...this.itemsToSell);
        data.assort.barter_scheme[itemBeingSoldId] = this.barterScheme[itemBeingSoldId];
        data.assort.loyal_level_items[itemBeingSoldId] = this.loyaltyLevel[itemBeingSoldId];

        this.itemsToSell = [];
        this.barterScheme = {};
        this.loyaltyLevel = {};
    }
}