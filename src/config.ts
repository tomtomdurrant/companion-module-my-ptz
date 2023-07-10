import { SomeCompanionConfigField } from '@companion-module/base'

export interface DeviceConfig {
	host?: string
	httpPort?: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This is my personal update to provide some panasonic ptz functionality ',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Camera IP',
			width: 4,
			// regex: Regex.IP
		},
		{
			type: 'number',
			id: 'httpPort',
			label: 'HTTP Port (Default: 80)',
			width: 3,
			default: 80,
			min: 1,
			max: 65535,
		},
	]
}
