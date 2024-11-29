import type { ILocation } from "@spt/models/eft/common/ILocation";
import type { IHandbookItem } from "@spt/models/eft/common/tables/IHandbookBase";
import type { IItem } from "@spt/models/eft/common/tables/IItem";
import type { IProps } from "@spt/models/eft/common/tables/ITemplateItem";
import type { IBarterScheme } from "@spt/models/eft/common/tables/ITrader";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import type { IRagfairConfig } from "@spt/models/spt/config/IRagfairConfig";
import type { NewItemFromCloneDetails } from "@spt/models/spt/mod/NewItemDetails";
import type { References } from "../Utils/References";
import { AllItemList, HandbookIDs, SlotsIDs } from "./GenEnums";

import * as fs from "node:fs";
import * as path from "node:path";

export class ItemGenerator {
    protected itemsToSell: IItem[] = [];
    protected barterScheme: Record<string, IBarterScheme[][]> = {};
    protected loyaltyLevel: Record<string, number> = {};
    private itemConfig: CustomItemFormat;

    constructor(private ref: References) {}

    //#region Item Gen
    public createCustomItems(itemDirectory: string): void {
        this.itemConfig = this.combineItems(itemDirectory);
        const tables = this.ref.tables;

        for (const newId in this.itemConfig) {
            const itemConfig = this.itemConfig[newId];
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const tempClone = AllItemList[itemConfig["ItemToClone"]] || itemConfig["ItemToClone"];
            const itemToClone = tempClone;

            const newItem: NewItemFromCloneDetails = {
                itemTplToClone: itemToClone,
                overrideProperties: itemConfig.OverrideProperties,
                parentId: tables.templates.items[itemToClone]._parent,
                newId: newId,
                handbookParentId: this.createHandbook(itemConfig, newId).ParentId,
                handbookPriceRoubles: this.createHandbook(itemConfig, newId).Price,
                fleaPriceRoubles: this.createHandbook(itemConfig, newId).Price,
                locales: {
                    en: {
                        name: itemConfig.LocalePush.en.name,
                        shortName: itemConfig.LocalePush.en.shortName,
                        description: itemConfig.LocalePush.en.description,
                    },
                },
            };
            this.ref.customItem.createItemFromClone(newItem);

            if (itemConfig.CloneToFilters) {
                this.cloneToFilters(itemConfig, newId);
            }

            if (itemConfig.PushMastery) {
                this.pushMastery(itemConfig, newId);
            }

            if (itemConfig.BotPush?.AddToBots) {
                this.addToBots(itemConfig, newId);
            }

            if (itemConfig.LootPush?.LootContainersToAdd !== undefined) {
                this.addToStaticLoot(itemConfig, newId);
            }

            if (itemConfig.CasePush?.CaseFiltersToAdd !== undefined) {
                this.addToCases(itemConfig, newId);
            }

            if (itemConfig.PushToFleaBlacklist) {
                this.pushToBlacklist(newId);
            }

            if (itemConfig.SlotPush?.Slot !== undefined) {
                this.pushToSlot(itemConfig, newId);
            }

            if (itemConfig.PresetPush !== undefined) {
                this.addCustomPresets(itemConfig);
            }

            if (itemConfig.QuestPush !== undefined) {
                this.addToQuests(
                    this.ref.tables.templates.quests,
                    itemConfig.QuestPush.QuestConditionType,
                    itemConfig.QuestPush.QuestTargetConditionToClone,
                    newId,
                );
            }

            this.buildCustomPresets(itemConfig, newId);
        }
    }

    private createHandbook(itemConfig: CustomItemFormat[string], itemID: string): IHandbookItem {
        const tables = this.ref.tables;
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        const tempClone = AllItemList[itemConfig["ItemToClone"]] || itemConfig["ItemToClone"];
        const itemToClone = tempClone;

        if (itemConfig.Handbook !== undefined) {
            const tempHBParent =
                // biome-ignore lint/complexity/useLiteralKeys: <explanation>
                HandbookIDs[itemConfig["Handbook"]["HandbookParent"]] || itemConfig["Handbook"]["HandbookParent"];
            const hbParent = tempHBParent;

            const handbookEntry: IHandbookItem = {
                Id: itemID,
                ParentId: hbParent,
                // biome-ignore lint/complexity/useLiteralKeys: <explanation>
                Price: itemConfig["Handbook"]["HandbookPrice"],
            };

            return handbookEntry;
            // biome-ignore lint/style/noUselessElse: <explanation>
        } else {
            const hbBase = tables.templates.handbook.Items.find((i) => i.Id === itemToClone);

            const handbookEntry = {
                Id: itemID,
                ParentId: hbBase.ParentId,
                Price: hbBase.Price,
            };

            return handbookEntry;
        }
    }

    private cloneToFilters(itemConfig: CustomItemFormat[string], itemID: string): void {
        const tables = this.ref.tables;
        const tempClone = AllItemList[itemConfig.ItemToClone] || itemConfig.ItemToClone;
        const itemToClone = tempClone;

        for (const item in tables.templates.items) {
            const itemConflictId = tables.templates.items[item]._props.ConflictingItems;

            for (const itemInConflicts in itemConflictId) {
                const itemInConflictsFiltersId = itemConflictId[itemInConflicts];

                if (itemInConflictsFiltersId === itemToClone) {
                    itemConflictId.push(itemID);
                }
            }

            for (const slots in tables.templates.items[item]._props.Slots) {
                const slotsId = tables.templates.items[item]._props.Slots[slots]._props.filters[0].Filter;

                for (const itemInFilters in slotsId) {
                    const itemInFiltersId = slotsId[itemInFilters];

                    if (itemInFiltersId === itemToClone) {
                        slotsId.push(itemID);
                    }
                }
            }

            for (const cartridge in tables.templates.items[item]._props.Cartridges) {
                const cartridgeId = tables.templates.items[item]._props.Cartridges[cartridge]._props.filters[0].Filter;

                for (const itemInFilters in cartridgeId) {
                    const itemInFiltersId = cartridgeId[itemInFilters];

                    if (itemInFiltersId === itemToClone) {
                        cartridgeId.push(itemID);
                    }
                }
            }

            for (const chamber in tables.templates.items[item]._props.Chambers) {
                const chamberId = tables.templates.items[item]._props.Chambers[chamber]._props.filters[0].Filter;

                for (const itemInFilters in chamberId) {
                    const itemInFiltersId = chamberId[itemInFilters];

                    if (itemInFiltersId === itemToClone) {
                        chamberId.push(itemID);
                    }
                }
            }
        }
    }

    private pushMastery(itemConfig: CustomItemFormat[string], itemID: string): void {
        const tables = this.ref.tables;
        const new_mastery_DJCore = {
            Name: itemConfig.LocalePush.en.name,
            Templates: [itemID],
            Level2: 450,
            Level3: 900,
        };
        tables.globals.config.Mastering.push(new_mastery_DJCore);
    }

    private addToBots(itemConfig: CustomItemFormat[string], itemID: string): void {
        const tables = this.ref.tables;
        const tempClone = AllItemList[itemConfig.ItemToClone] || itemConfig.ItemToClone;
        const itemToClone = tempClone;

        for (const botId in tables.bots.types) {
            for (const lootSlot in tables.bots.types[botId].inventory.items) {
                const items = tables.bots.types[botId].inventory.items;

                if (items[lootSlot][itemToClone]) {
                    const weight = items[lootSlot][itemToClone];
                    items[lootSlot][itemID] = weight;
                }
            }

            for (const equipSlot in tables.bots.types[botId].inventory.equipment) {
                const equip = tables.bots.types[botId].inventory.equipment;

                if (equip[equipSlot][itemToClone]) {
                    const weight = equip[equipSlot][itemToClone];
                    equip[equipSlot][itemID] = weight;
                }
            }

            for (const modItem in tables.bots.types[botId].inventory.mods) {
                for (const modSlot in tables.bots.types[botId].inventory.mods[modItem]) {
                    if (tables.bots.types[botId]?.inventory?.mods[modItem][modSlot][itemToClone]) {
                        tables.bots.types[botId].inventory.mods[modItem][modSlot].push(itemID);
                    }
                }

                if (tables.bots.types[botId]?.inventory?.mods[itemToClone]) {
                    tables.bots.types[botId].inventory.mods[itemID] = structuredClone(
                        tables.bots.types[botId].inventory.mods[itemToClone],
                    );
                }
            }
        }
    }

    private addToStaticLoot(itemConfig: CustomItemFormat[string], itemID: string): void {
        const tables = this.ref.tables;
        const locations = tables.locations;

        if (Array.isArray(itemConfig.LootPush?.LootContainersToAdd)) {
            // biome-ignore lint/complexity/noForEach: <explanation>
            itemConfig.LootPush?.LootContainersToAdd.forEach((lootContainer) => {
                const tempLC = AllItemList[lootContainer] || lootContainer;
                const staticLC = tempLC;

                const lootToPush = {
                    tpl: itemID,
                    relativeProbability: itemConfig.LootPush?.StaticLootProbability,
                };

                for (const map in locations) {
                    // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
                    if (locations.hasOwnProperty(map)) {
                        const location: ILocation = locations[map];
                        if (location.staticLoot) {
                            const staticLoot = location.staticLoot;
                            // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
                            if (staticLoot.hasOwnProperty(staticLC)) {
                                const staticContainer = staticLoot[staticLC];
                                if (staticContainer) {
                                    staticContainer.itemDistribution.push(lootToPush);
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    private addToCases(itemConfig: CustomItemFormat[string], itemID: string): void {
        const tables = this.ref.tables;
        const items = tables.templates.items;

        if (Array.isArray(itemConfig.CasePush?.CaseFiltersToAdd)) {
            // biome-ignore lint/complexity/noForEach: <explanation>
            itemConfig.CasePush?.CaseFiltersToAdd.forEach((caseToAdd) => {
                const tempCases = AllItemList[caseToAdd] || caseToAdd;
                const cases = tempCases;

                for (const item in items) {
                    if (items[item]._id === cases) {
                        if (items[item]._props?.Grids[0]._props.filters[0].Filter === undefined) {
                            const unbreakFilters = [
                                {
                                    Filter: ["54009119af1c881c07000029"],
                                    ExcludedFilter: ["5447e1d04bdc2dff2f8b4567"],
                                },
                            ];

                            tables.templates.items[cases]._props.Grids[0]._props.filters = unbreakFilters;
                        } else if (items[item]._props?.Grids[0]._props.filters[0].Filter !== undefined) {
                            items[item]._props?.Grids[0]._props.filters[0].Filter.push(itemID);
                        }
                    }
                }
            });
        } else {
            for (const item in items) {
                if (items[item]._id === itemConfig.CasePush?.CaseFiltersToAdd) {
                    if (items[item]._props?.Grids[0]._props.filters[0].Filter === undefined) {
                        const unbreakFilters = [
                            {
                                Filter: ["54009119af1c881c07000029"],
                                ExcludedFilter: ["5447e1d04bdc2dff2f8b4567"],
                            },
                        ];

                        tables.templates.items[itemConfig.CasePush?.CaseFiltersToAdd]._props.Grids[0]._props.filters =
                            unbreakFilters;
                    }

                    if (items[item]._props?.Grids[0]._props.filters[0].Filter !== undefined) {
                        items[item]._props?.Grids[0]._props.filters[0].Filter.push(itemID);
                    }
                }
            }
        }
    }

    private pushToSlot(itemConfig: CustomItemFormat[string], itemID: string): void {
        const tables = this.ref.tables;
        const DefaultInventory = tables.templates.items["55d7217a4bdc2d86028b456d"]._props.Slots;
        const tempSlot = SlotsIDs[itemConfig.SlotPush?.Slot] || itemConfig.SlotPush?.Slot;
        const slotToPush = tempSlot;

        DefaultInventory[slotToPush]._props.filters[0].Filter.push(itemID);
    }

    private pushToBlacklist(itemID: string): void {
        const ragfair = this.ref.configServer.getConfig<IRagfairConfig>(ConfigTypes.RAGFAIR);
        ragfair.dynamic.blacklist.custom.push(...[itemID]);
    }

    private combineItems(itemDirectory: string) {
        const modules = fs.readdirSync(path.join(__dirname, itemDirectory));

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const combinedModules: any = {};

        // biome-ignore lint/complexity/noForEach: <explanation>
        modules.forEach((modFile) => {
            const filesPath = path.join(__dirname, itemDirectory, modFile);
            const fileContents = fs.readFileSync(filesPath, "utf-8");
            const module = JSON.parse(fileContents) as CustomItemFormat;

            Object.assign(combinedModules, module);
        });

        return combinedModules;
    }

    private addCustomPresets(itemConfig: CustomItemFormat[string]): void {
        const tables = this.ref.tables;
        const customPresets = itemConfig.PresetPush.PresetToAdd;
        const presets = tables.globals.ItemPresets;

        if (itemConfig.PresetPush !== undefined) {
            // biome-ignore lint/complexity/noForEach: <explanation>
            customPresets.forEach((preset) => {
                const finalPreset: PresetFormat = {
                    _changeWeaponName: preset._changeWeaponName,
                    _encyclopedia: preset._encyclopedia || undefined,
                    _id: preset._id,
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    _items: preset._items.map((itemData: any) => {
                        const item: IItem = {
                            _id: itemData._id,
                            _tpl: itemData._tpl,
                        };

                        if (itemData.parentId) {
                            item.parentId = itemData.parentId;
                        }
                        if (itemData.slotId) {
                            item.slotId = itemData.slotId;
                        }

                        return item;
                    }),
                    _name: preset._name,
                    _parent: preset._parent,
                    _type: "Preset",
                };

                presets[finalPreset._id] = finalPreset;
            });
        }
    }

    private buildCustomPresets(itemConfig: CustomItemFormat[string], itemID: string): void {
        const tables = this.ref.tables;
        const presets = tables.globals.ItemPresets;
        const basePresetID = this.ref.hashUtil.generate();

        if (
            tables.templates.items[itemID]._parent === "5a341c4086f77401f2541505" ||
            tables.templates.items[itemID]._parent === "5448e5284bdc2dcb718b4567" ||
            tables.templates.items[itemID]._parent === "5448e54d4bdc2dcc718b4568"
        ) {
            const finalPreset = {
                _changeWeaponName: false,
                _encyclopedia: itemID,
                _id: this.ref.hashUtil.generate(),
                _items: [],
                _name: `${itemConfig.LocalePush.en.name} Preset`,
                _parent: basePresetID,
                _type: "Preset",
            };

            finalPreset._items.push({ _id: basePresetID, _tpl: itemID });

            // biome-ignore lint/complexity/noForEach: <explanation>
            tables.templates.items[itemID]._props.Slots.forEach((slot) => {
                if (slot._name !== "mod_nvg") {
                    finalPreset._items.push({
                        _id: this.ref.hashUtil.generate(),
                        _tpl: this.ref.randomUtil
                            .drawRandomFromList(slot._props.filters[0].Filter, 1, false)
                            .toString(),
                        parentId: basePresetID,
                        slotId: slot._name,
                    });
                }
            });

            presets[finalPreset._id] = finalPreset;
        }
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    private addToQuests(quests: any, condition: string, target: string, newTarget: string): void {
        for (const quest of Object.keys(quests)) {
            const questConditions = quests[quest];
            for (const nextCondition of questConditions.conditions.AvailableForFinish) {
                const nextConditionData = nextCondition;
                if (nextConditionData.conditionType === condition && nextConditionData.target.includes(target)) {
                    nextConditionData.target.push(newTarget);
                }
            }
        }
    }
    //#endregion
    //
    //
    //
    //#region Clothing Gen
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    public createClothingTop(newTopConfig: any): void {
        const tables = this.ref.tables;
        const newTop = structuredClone(tables.templates.customization["5d28adcb86f77429242fc893"]);
        const newHands = structuredClone(tables.templates.customization[newTopConfig.HandsToClone]);
        const newSet = structuredClone(tables.templates.customization["5d1f623e86f7744bce0ef705"]);

        newTop._id = newTopConfig.NewOutfitID;
        newTop._name = newTopConfig.LocaleName;
        newTop._props.Prefab.path = newTopConfig.BundlePath;
        tables.templates.customization[newTopConfig.NewOutfitID] = newTop;

        newHands._id = newTopConfig.NewHandsID;
        newHands._name = `${newTopConfig.LocaleName} Hands`;
        newHands._props.Prefab.path = newTopConfig.HandsBundlePath;
        tables.templates.customization[newTopConfig.NewHandsID] = newHands;

        newSet._id = newTopConfig.NewSetID;
        newSet._name = `${newTopConfig.LocaleName} Set`;
        newSet._props.Body = newTopConfig.NewOutfitID;
        newSet._props.Hands = newHands._id;
        newSet._props.Side = ["Usec", "Bear", "Savage"];
        tables.templates.customization[newTopConfig.NewSetID] = newSet;

        for (const locale in tables.locales.global) {
            tables.locales.global[locale][newSet._name] = newTopConfig.LocaleName;
        }

        if (newTopConfig.TraderScheme !== undefined) {
            if (!tables.traders[newTopConfig.TraderScheme?.TraderToUse].base.customization_seller) {
                tables.traders[newTopConfig.TraderScheme?.TraderToUse].base.customization_seller = true;
            }

            if (!tables.traders[newTopConfig.TraderScheme?.TraderToUse].suits) {
                tables.traders[newTopConfig.TraderScheme?.TraderToUse].suits = [];
            }

            tables.traders[newTopConfig.TraderScheme?.TraderToUse].suits.push({
                _id: newTopConfig.NewOutfitID,
                tid: newTopConfig.TraderScheme?.TraderToUse,
                suiteId: newTopConfig.NewSetID,
                isActive: true,
                requirements: {
                    loyaltyLevel: newTopConfig.TraderScheme?.LoyaltyLevel,
                    profileLevel: newTopConfig.TraderScheme?.ProfileLevelRequirement,
                    standing: newTopConfig.TraderScheme?.TraderStandingRequirement,
                    skillRequirements: [],
                    questRequirements: [],
                    itemRequirements: [
                        {
                            count: newTopConfig.TraderScheme?.Cost,
                            _tpl: newTopConfig.TraderScheme?.CurrencyToUse,
                            onlyFunctional: false,
                        },
                    ],
                    achievementRequirements: [],
                    requiredTid: "",
                },
                externalObtain: false,
                internalObtain: false,
                isHiddenInPVE: false,
            });
        }
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    public createClothingBottom(newBottomConfig: any): void {
        const tables = this.ref.tables;
        const newBottom = structuredClone(tables.templates.customization["5d5e7f4986f7746956659f8a"]);
        const newSet = structuredClone(tables.templates.customization["5cd946231388ce000d572fe3"]);

        newBottom._id = newBottomConfig.NewBottomsID;
        newBottom._name = newBottomConfig.LocaleName;
        newBottom._props.Prefab.path = newBottomConfig.BundlePath;
        tables.templates.customization[newBottomConfig.NewBottomsID] = newBottom;

        newSet._id = newBottomConfig.NewSetID;
        newSet._name = `${newBottomConfig.NewBottomsID} Set`;
        newSet._props.Feet = newBottomConfig.NewBottomsID;
        newSet._props.Side = ["Usec", "Bear", "Savage"];
        tables.templates.customization[newBottomConfig.NewSetID] = newSet;

        for (const locale in tables.locales.global) {
            tables.locales.global[locale][newBottomConfig.NewBottomsID] = newBottomConfig.LocaleName;
        }

        if (newBottomConfig.TraderScheme !== undefined) {
            if (!tables.traders[newBottomConfig.TraderScheme?.TraderToUse].base.customization_seller) {
                tables.traders[newBottomConfig.TraderScheme?.TraderToUse].base.customization_seller = true;
            }

            if (!tables.traders[newBottomConfig.TraderScheme?.TraderToUse].suits) {
                tables.traders[newBottomConfig.TraderScheme?.TraderToUse].suits = [];
            }

            tables.traders[newBottomConfig.TraderScheme?.TraderToUse].suits.push({
                _id: newBottomConfig.NewBottomsID,
                tid: newBottomConfig.TraderScheme?.TraderToUse,
                suiteId: newBottomConfig.NewSetID,
                isActive: true,
                requirements: {
                    loyaltyLevel: newBottomConfig.TraderScheme?.LoyaltyLevel,
                    profileLevel: newBottomConfig.TraderScheme?.ProfileLevelRequirement,
                    standing: newBottomConfig.TraderScheme?.TraderStandingRequirement,
                    skillRequirements: [],
                    questRequirements: [],
                    itemRequirements: [
                        {
                            count: newBottomConfig.TraderScheme?.Cost,
                            _tpl: newBottomConfig.TraderScheme?.CurrencyToUse,
                            onlyFunctional: false,
                        },
                    ],
                    achievementRequirements: [],
                    requiredTid: "",
                },
                externalObtain: false,
                internalObtain: false,
                isHiddenInPVE: false,
            });
        }
    }
    //#endregion
}

export interface CustomItemFormat {
    [newID: string]: {
        ItemToClone: string;
        OverrideProperties: IProps;
        LocalePush: {
            en: {
                name: string;
                shortName: string;
                description: string;
            };
        };
        Handbook?: {
            HandbookParent: string;
            HandbookPrice: number;
        };
        SlotPush?: {
            Slot: number;
        };
        BotPush?: {
            AddToBots: boolean;
        };
        CasePush?: {
            CaseFiltersToAdd: string[];
        };
        LootPush?: {
            LootContainersToAdd: string[];
            StaticLootProbability: number;
        };
        PresetPush?: {
            PresetToAdd: PresetFormat[];
        };
        QuestPush?: {
            QuestConditionType: string;
            QuestTargetConditionToClone: string;
        };
        PushToFleaBlacklist?: boolean;
        CloneToFilters?: boolean;
        PushMastery?: boolean;
    };
}

export interface PresetFormat {
    _changeWeaponName: boolean;
    _encyclopedia?: string;
    _id: string;
    _items: ItemFormat[];
    _name: string;
    _parent: string;
    _type: string;
}

export interface ItemFormat {
    _id: string;
    _tpl: string;
    parentId?: string;
    slotId?: string;
}
