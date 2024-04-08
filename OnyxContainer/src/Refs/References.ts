import { DependencyContainer }              from "tsyringe";
import { ILogger }                          from "@spt-aki/models/spt/utils/ILogger";
import { StaticRouterModService }           from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { ProfileHelper }                    from "@spt-aki/helpers/ProfileHelper";
import { DatabaseServer }                   from "@spt-aki/servers/DatabaseServer";
import { IDatabaseTables }                  from "@spt-aki/models/spt/server/IDatabaseTables";
import { ConfigServer }                     from "@spt-aki/servers/ConfigServer";
import { JsonUtil }                         from "@spt-aki/utils/JsonUtil";
import { VFS }                              from "@spt-aki/utils/VFS";
import { ImporterUtil }                     from "@spt-aki/utils/ImporterUtil";
import { PreAkiModLoader }                  from "@spt-aki/loaders/PreAkiModLoader";
import { ImageRouter }                      from "@spt-aki/routers/ImageRouter";
import { OnUpdateModService }               from "@spt-aki/services/mod/onUpdate/OnUpdateModService"
import { RagfairPriceService }              from "@spt-aki/services/RagfairPriceService";
import { CustomItemService }                from "@spt-aki/services/mod/CustomItemService";
import { SaveServer }                       from "@spt-aki/servers/SaveServer";
import { ItemHelper }                       from "@spt-aki/helpers/ItemHelper";
import { BotHelper }                        from "@spt-aki/helpers/BotHelper";
import { RandomUtil }                       from "@spt-aki/utils/RandomUtil";

export class References 
{
    public modName: string;
    public debug: boolean;

    public container: DependencyContainer;
    public preAkiModLoader: PreAkiModLoader;
    public configServer: ConfigServer;
    public saveServer: SaveServer;
    public itemHelper: ItemHelper;
    public logger: ILogger;
    public staticRouter: StaticRouterModService;
    public onUpdateModService: OnUpdateModService;

    public database: DatabaseServer;
    public customItem: CustomItemService;
    public imageRouter: ImageRouter;
    public jsonUtil: JsonUtil;
    public profileHelper: ProfileHelper;
    public ragfairPriceService: RagfairPriceService;
    public importerUtil: ImporterUtil;
    public vfs: VFS;
    public tables: IDatabaseTables;
    public botHelper: BotHelper;
    public randomUtil: RandomUtil;


    public preAkiLoad(container: DependencyContainer, mod: string): void
    {
        this.modName = mod;

        this.container = container;
        this.preAkiModLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");
        this.imageRouter = container.resolve<ImageRouter>("ImageRouter");
        this.configServer = container.resolve<ConfigServer>("ConfigServer");
        this.saveServer = container.resolve<SaveServer>("SaveServer");
        this.itemHelper = container.resolve<ItemHelper>("ItemHelper");
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.staticRouter = container.resolve<StaticRouterModService>("StaticRouterModService");
        this.onUpdateModService = container.resolve<OnUpdateModService>( "OnUpdateModService" );
        this.randomUtil = container.resolve<RandomUtil>("RandomUtil");
    }

    public postDBLoad(container: DependencyContainer): void
    {
        this.container = container;
        this.database = container.resolve<DatabaseServer>("DatabaseServer");
        this.tables = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        this.customItem = container.resolve<CustomItemService>("CustomItemService");
        this.jsonUtil = container.resolve<JsonUtil>("JsonUtil");
        this.profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
        this.ragfairPriceService = container.resolve<RagfairPriceService>("RagfairPriceService");
        this.importerUtil = container.resolve<ImporterUtil>("ImporterUtil");
        this.vfs = container.resolve<VFS>("VFS");
        this.botHelper = container.resolve<BotHelper>("BotHelper")
        this.randomUtil = container.resolve<RandomUtil>("RandomUtil");
        this.itemHelper = container.resolve<ItemHelper>("ItemHelper");
    }
}