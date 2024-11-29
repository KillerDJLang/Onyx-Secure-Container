import { DependencyContainer } from "tsyringe";

import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

import { ItemGenerator } from "./CustomItems/ItemGenerator";
import { AssortUtils } from "./CustomItems/AssortUtils";
import { TradersIDs, CurrencyIDs, AllItemList } from "./CustomItems/GenEnums";
import { Logger } from "./Utils/Logger";
import { References } from "./Utils/References";

class OnyxContainer implements IPreSptLoadMod, IPostDBLoadMod {
    private ref: References = new References();
    private logger: Logger = new Logger(this.ref);

    private static DepCheck(modLoader: PreSptModLoader): boolean {
        try {
            return modLoader.getImportedModsNames().includes("SariaShop");
        } catch {
            return false;
        }
    }

    public preSptLoad(container: DependencyContainer): void {
        this.ref.preSptLoad(container);
    }

    public postDBLoad(container: DependencyContainer): void {
        this.ref.postDBLoad(container);

        if (!OnyxContainer.DepCheck(this.ref.preSptModLoader)) {
            return this.logger.logError(
                "Error, missing dependancy Saria Shop.\nMake sure you have installed this mod and it's dependancy correctly.",
            );
        }

        const itemGenerator = new ItemGenerator(this.ref);
        const assortUtils = new AssortUtils(this.ref.hashUtil, this.ref.logger);
        itemGenerator.createCustomItems("../../db/ItemGen");
        assortUtils.createSingleAssortItem("674a33573fef1c2943025680")
                    .addStackCount(1)
                    .addLoyaltyLevel(2)
                    .addBarterCost(AllItemList["SECURE_KAPPA"], 1)
                    .addBarterCost(CurrencyIDs["Rub"], 10000000)
                    .export(this.ref.tables.traders[TradersIDs["Saria"]], false);

        this.logger.log("Saria has crafted a new secured container...use it well.", LogTextColor.CYAN);
    }
}
module.exports = { mod: new OnyxContainer() };
