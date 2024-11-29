import { DependencyContainer } from "tsyringe";

import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

import { ItemGenerator } from "./CustomItems/ItemGenerator";
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
        itemGenerator.createCustomItems("../../db/ItemGen");

        this.logger.log("Saria has crafted a new secured container...use it well.", LogTextColor.CYAN);
    }
}
module.exports = { mod: new OnyxContainer() };
