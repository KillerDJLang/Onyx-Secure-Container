import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import type { References } from "./References";

export class Logger {
    private logPrefix = "[Onyx Container] ";

    constructor(private ref: References) {}

    public log(text: string, textColor?: LogTextColor) {
        if (typeof textColor !== "undefined") {
            this.ref.logger.log(this.logPrefix + text, textColor);
        } else {
            this.ref.logger.log(this.logPrefix + text, LogTextColor.WHITE);
        }
    }

    public logError(errorText: string) {
        this.ref.logger.error(this.logPrefix + errorText);
    }

    public logWarning(text: string) {
        this.ref.logger.warning(this.logPrefix + text);
    }
}
