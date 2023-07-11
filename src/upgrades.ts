import { CompanionStaticUpgradeScript, CreateConvertToBooleanFeedbackUpgradeScript } from '@companion-module/base'
import { DeviceConfig } from './config.js'

export const UpgradeScripts: CompanionStaticUpgradeScript<DeviceConfig>[] = [
	// no upgrade
	CreateConvertToBooleanFeedbackUpgradeScript({}),
]
