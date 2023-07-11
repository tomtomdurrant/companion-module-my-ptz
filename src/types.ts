import { InstanceBase } from '@companion-module/base'
import { DeviceConfig } from './config.js'

export interface MyInstanceBase extends InstanceBase<DeviceConfig> {
	config: DeviceConfig
}
