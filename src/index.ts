import {
	CompanionVariableDefinition,
	InstanceBase,
	InstanceStatus,
	runEntrypoint,
	SomeCompanionConfigField,
} from '@companion-module/base'
import { GetConfigFields as getConfigFields, DeviceConfig } from './config.js'
import { MyInstanceBase } from './types.js'
import { UpgradeScripts } from './upgrades.js'
import got from 'got'
import { clearIntervalAsync, setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async'

class MyInstance extends InstanceBase<DeviceConfig> implements MyInstanceBase {
	public config: DeviceConfig
	private interval: SetIntervalAsyncTimer<any> | undefined

	constructor(internal: unknown) {
		super(internal)
		this.config = {}
	}

	async configUpdated(config: DeviceConfig): Promise<void> {
		this.config = config

		this.saveConfig(this.config)

		this.initActions()
	}

	async init(config: DeviceConfig): Promise<void> {
		this.config = config
		this.log('info', 'init')

		this.updateStatus(InstanceStatus.Connecting)

		this.initActions()
		this.initFeedbacks()
		await this.initVariables().catch((_) => {
			this.updateStatus(InstanceStatus.ConnectionFailure)
		})
		this.updateStatus(InstanceStatus.Ok)
	}

	async destroy(): Promise<void> {
		this.log('debug', 'destroy')

		if (this.interval) {
			clearIntervalAsync(this.interval).catch((e) => {
				this.log('error', e)
			})
			this.interval = undefined
		}
	}
	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	private initActions() {
		this.setActionDefinitions({})
	}

	// Set up Feedbacks
	private initFeedbacks() {
		this.setFeedbackDefinitions({})
	}
	private parse(currentPreset: string) {
		const lines = currentPreset.split('\n')
		let preset = 'Err'
		if (this.config.debug) {
			this.log('debug', lines.join(','))
		}
		for (const line of lines) {
			const str = line.trim().split(':')
			if (str[0].startsWith('s') && !str[0].includes('W')) {
				const lastPreset = line.slice(1)

				preset = lastPreset
				if (this.config.debug) {
					this.log('debug', `preset updated to ${lastPreset}`)
				}
			}
		}
		return preset
	}
	private async initVariables() {
		const variables: CompanionVariableDefinition[] = [
			{
				variableId: 'currentPresetCam1',
				name: 'Current Preset - 1',
			},
			{
				variableId: 'currentPresetCam2',
				name: 'Current Preset - 2',
			},
			{
				variableId: 'currentPresetCam3',
				name: 'Current Preset - 3',
			},
			{
				variableId: 'currentPresetCam4',
				name: 'Current Preset - 4',
			},
		]

		this.setVariableDefinitions(variables)
		this.interval = setIntervalAsync(async () => {
			const [cam1, cam2, cam3, cam4] = await Promise.all([
				this.checkCamera(1),
				this.checkCamera(2),
				this.checkCamera(3),
				this.checkCamera(4),
			])
			// this.setVariableValues({
			// 	currentPresetCam1: camPresets.currentPresetCam1,
			// 	currentPresetCam2: camPresets.currentPresetCam2,
			// 	currentPresetCam3: camPresets.currentPresetCam3,
			// 	currentPresetCam4: camPresets.currentPresetCam4,
			// })
			this.setVariableValues({
				currentPresetCam1: cam1 as string,
				currentPresetCam2: cam2 as string,
				currentPresetCam3: cam3 as string,
				currentPresetCam4: cam4 as string,
			})
		}, 1000)
	}

	private async checkCamera(camNum: number): Promise<string | void> {
		return got(`http://10.6.16.15${camNum}/live/camdata.html`)
			.text()
			.then((currentPreset) => {
				const preset = this.parse(currentPreset)
				if (this.config.debug) {
					this.log('debug', `camera ${camNum} preset is ${preset}`)
				}

				// this.cameraPresets[`currentPresetCam${camNum}`] = preset
				return preset
			})
			.catch((e) => {
				this.log('error', JSON.stringify(e))
			})
	}
}

runEntrypoint(MyInstance, UpgradeScripts)
