import { SomeCompanionConfigField } from '@companion-module/base'

export interface DeviceConfig {
	host?: string
	httpPort?: number
	debug?: boolean
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
		{
			type: 'checkbox',
			id: 'debug',
			width: 1,
			label: 'Enable',
			default: false,
		},
		{
			type: 'static-text',
			id: 'debugInfo',
			width: 11,
			label: 'Enable Debug To Log Window',
			value:
				'Requires Companion to be restarted. But this will allow you the see what is being sent from the module and what is being received from the camera.',
		},
	]
}
