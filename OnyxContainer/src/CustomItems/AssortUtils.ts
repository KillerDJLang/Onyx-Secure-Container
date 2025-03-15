import type { IItem } from "@spt/models/eft/common/tables/IItem";
import type {
  IBarterScheme,
  ITrader,
} from "@spt/models/eft/common/tables/ITrader";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import type { HashUtil } from "@spt/utils/HashUtil";
import type { Money } from "@spt/models/enums/Money";

    export class AssortUtils {
      
        protected itemsToSell: IItem[] = [];
        protected barterScheme: Record<string, IBarterScheme[][]> = {};
        protected loyaltyLevel: Record<string, number> = {};
        protected hashUtil: HashUtil;
        protected logger: ILogger;
      
        constructor(hashutil: HashUtil, logger: ILogger) {
          this.hashUtil = hashutil;
          this.logger = logger;
        }
      
        /**
         * Start selling item with tpl
         * @param itemTpl Tpl id of the item you want trader to sell
         * @param itemId Optional - set your own Id, otherwise unique id will be generated
         */
        public createSingleAssortItem(
          itemTpl: string,
          itemId = undefined
        ): AssortUtils {
          // Create item ready for insertion into assort table
          const newItemToAdd: IItem = {
            _id: !itemId ? this.hashUtil.generate() : itemId,
            _tpl: itemTpl,
            parentId: "hideout", // Should always be "hideout"
            slotId: "hideout", // Should always be "hideout"
            upd: {
              UnlimitedCount: false,
              StackObjectsCount: 100,
            },
          };
      
          this.itemsToSell.push(newItemToAdd);
      
          return this;
        }
      
        public createComplexAssortItem(items: IItem[]): AssortUtils {
          items[0].parentId = "hideout";
          items[0].slotId = "hideout";
      
          if (!items[0].upd) {
            items[0].upd = {};
          }
      
          items[0].upd.UnlimitedCount = false;
          items[0].upd.StackObjectsCount = 100;
      
          this.itemsToSell.push(...items);
      
          return this;
        }
      
        public addStackCount(stackCount: number): AssortUtils {
          this.itemsToSell[0].upd.StackObjectsCount = stackCount;
      
          return this;
        }
      
        public addLoyaltyLevel(level: number) {
          this.loyaltyLevel[this.itemsToSell[0]._id] = level;
      
          return this;
        }
      
        public addMoneyCost(currencyType: Money, amount: number): AssortUtils {
          this.barterScheme[this.itemsToSell[0]._id] = [
            [
              {
                count: amount,
                _tpl: currencyType,
              },
            ],
          ];
      
          return this;
        }
      
        public addBarterCost(itemTpl: string, count: number): AssortUtils {
          const sellableItemId = this.itemsToSell[0]._id;
      
          // No data at all, create
          if (Object.keys(this.barterScheme).length === 0) {
            this.barterScheme[sellableItemId] = [
              [
                {
                  count: count,
                  _tpl: itemTpl,
                },
              ],
            ];
          } else {
            // Item already exists, add to
            const existingData = this.barterScheme[sellableItemId][0].find(
              (x) => x._tpl === itemTpl
            );
            if (existingData) {
              // itemtpl already a barter for item, add to count
              existingData.count += count;
            } else {
              // No barter for item, add it fresh
              this.barterScheme[sellableItemId][0].push({
                count: count,
                _tpl: itemTpl,
              });
            }
          }
      
          return this;
        }
      
        /**
         * Reset object ready for reuse
         * @returns
         */
        public export(data: ITrader, blockDupes: boolean): AssortUtils {
          const itemBeingSoldId = this.itemsToSell[0]._id;
          const itemBeingSoldTpl = this.itemsToSell[0]._tpl;
          if (blockDupes) {
            if (data.assort.items.find((x) => x._id === itemBeingSoldId)) {
              return;
            }
      
            if (data.assort.items.find((x) => x._tpl === itemBeingSoldTpl)) {
              return;
            }
          }
      
          data.assort.items.push(...this.itemsToSell);
          data.assort.barter_scheme[itemBeingSoldId] =
            this.barterScheme[itemBeingSoldId];
          data.assort.loyal_level_items[itemBeingSoldId] =
            this.loyaltyLevel[itemBeingSoldId];
      
          this.itemsToSell = [];
          this.barterScheme = {};
          this.loyaltyLevel = {};
      
          return this;
        }
    }