/// <reference types="spotify-api" />

import {
	CompanionVariableDefinition,
	InstanceBase,
	InstanceStatus,
	runEntrypoint,
	SomeCompanionConfigField,
} from '@companion-module/base'
import { GetConfigFields, DeviceConfig } from './config.js'
// import { FeedbackId, GetFeedbacksList } from './feedback.js'
import { MyInstanceBase } from './types.js'
import { UpgradeScripts } from './upgrades.js'
import got from 'got'
import { clearIntervalAsync, setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async'
// import { CameraState } from './state.js'

class MyInstance extends InstanceBase<DeviceConfig> implements MyInstanceBase {
	public config: DeviceConfig
	interval: SetIntervalAsyncTimer<any> | undefined

	// private pollTimer: NodeJS.Timeout | undefined

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

		// if (!this.pollTimer) {
		// 	this.pollTimer = setInterval(() => this.queuePoll(), 3000) // Check every 3 seconds. This leaves a bit of headroom before we hit the daily api limit
		// }

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
			// clearInterval(this.pollTimer)
			delete this.interval
		}
	}
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}
	private initActions() {
		this.setActionDefinitions({})
	}
	// Set up Feedbacks
	private initFeedbacks() {
		// const feedbacks = GetFeedbacksList(() => this.state)
		this.setFeedbackDefinitions({})
	}
	// private async waitUntil(condition) {
	// 	return await new Promise((resolve) => {
	// 		const interval = setInterval(() => {
	// 			if (condition) {
	// 				resolve('foo')
	// 				clearInterval(interval)
	// 			}
	// 		}, 1000)
	// 	})
	// }
	private parse(currentPreset: string) {
		const lines = currentPreset.split('\n')
		let preset = ''
		// this.log('error', lines.join(','))
		for (const line of lines) {
			const str = line.trim().split(':')
			// console.log(str);
			if (str[0].startsWith('s') && !str[0].includes('W')) {
				// console.log(str)
				const lastPreset = line.slice(1)
				// this.log('info', `last preset is ${lastPreset}`)

				// console.log(lastPreset);
				preset = lastPreset
				// this.log('info', `preset updated to ${lastPreset}`)
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
		const camPresets = {
			currentPresetCam1: '',
			currentPresetCam2: '',
			currentPresetCam3: '',
			currentPresetCam4: '',
		}
		this.interval = setIntervalAsync(async () => {
			await got(`http://10.6.16.151/live/camdata.html`)
				.text()
				.then((currentPreset) => {
					const preset = this.parse(currentPreset)

					camPresets[`currentPresetCam1`] = preset
				})
				.catch((e) => {
					this.log('error', JSON.stringify(e))
				})
			await got(`http://10.6.16.152/live/camdata.html`)
				.text()
				.then((currentPreset) => {
					const preset = this.parse(currentPreset)

					camPresets[`currentPresetCam2`] = preset
				})
				.catch((e) => {
					this.log('error', JSON.stringify(e))
				})

			await got(`http://10.6.16.153/live/camdata.html`)
				.text()
				.then((currentPreset) => {
					const preset = this.parse(currentPreset)

					camPresets[`currentPresetCam3`] = preset
				})
				.catch((e) => {
					this.log('error', JSON.stringify(e))
				})
			await got(`http://10.6.16.154/live/camdata.html`)
				.text()
				.then((currentPreset) => {
					const preset = this.parse(currentPreset)

					camPresets[`currentPresetCam4`] = preset
				})
				.catch((e) => {
					this.log('error', JSON.stringify(e))
				})
			// this.log('info', `cam presets are ${JSON.stringify(camPresets)}`)
			this.setVariableValues({
				currentPresetCam1: camPresets.currentPresetCam1,
				currentPresetCam2: camPresets.currentPresetCam2,
				currentPresetCam3: camPresets.currentPresetCam3,
				currentPresetCam4: camPresets.currentPresetCam4,
			})
		}, 1000)
	}

	// 	private async doPollPlaybackState() {
	// 		const reqOptions = this.getRequestOptionsBase()
	// 		if (!reqOptions) return
	// 		try {
	// 			const data = await getMyCurrentPlaybackState(reqOptions)

	// 			// Transform the library state into a minimal state that we want to track
	// 			let newState: SpotifyPlaybackState | null = null
	// 			if (data.body) {
	// 				newState = {
	// 					isPlaying: !!data.body.is_playing,
	// 					isShuffle: !!data.body.shuffle_state,
	// 					repeatState: data.body.repeat_state,
	// 					currentContext: data.body.context && data.body.context.uri.split(':')[2],
	// 					trackProgressMs: data.body.progress_ms ?? 0,
	// 					trackInfo: null,
	// 					deviceInfo: null,
	// 				}

	// 				if (data.body.item) {
	// 					newState.trackInfo = {
	// 						durationMs: data.body.item.duration_ms,
	// 						name: data.body.item.name,
	// 						artistName: null,
	// 						albumName: null,
	// 						albumImageUrl: null,
	// 					}

	// 					if ('artists' in data.body.item) {
	// 						const rawArtists = data.body.item.artists
	// 						newState.trackInfo.artistName = rawArtists.map((a) => a.name).join(', ')
	// 					}

	// 					if ('album' in data.body.item) {
	// 						const rawAlbum = data.body.item.album
	// 						newState.trackInfo.albumName = rawAlbum.name

	// 						if (rawAlbum.images.length > 0) newState.trackInfo.albumImageUrl = rawAlbum.images[0].url
	// 					}
	// 				}

	// 				if (data.body.device) {
	// 					newState.deviceInfo = {
	// 						id: data.body.device.id,
	// 						name: data.body.device.name,

	// 						volumePercent: data.body.device.volume_percent,
	// 					}
	// 				}
	// 			}

	// 			// Diff the state and inform companion of anything that changed
	// 			this.diffAndSavePlaybackState(newState)
	// 			this.updateStatus(InstanceStatus.Ok)
	// 		} catch (err) {
	// 			this.updateStatus(InstanceStatus.ConnectionFailure, 'Failed to query Api')

	// 			const retry = await this.checkIfApiErrorShouldRetry(err)
	// 			if (retry) {
	// 				this.queuePoll()
	// 			} else {
	// 				// clear the playback state, as we don't know what is going on..
	// 				this.diffAndSavePlaybackState(null)
	// 			}
	// 		}
	// 	}

	// 	private diffAndSavePlaybackState(newState: SpotifyPlaybackState | null) {
	// 		const oldState = this.state.playbackState
	// 		this.state.playbackState = newState

	// 		// console.log('NEW STATE', JSON.stringify(newState))
	// 		const forceUpdate = !oldState && !!newState

	// 		// Collect updates for batch saving
	// 		const invalidatedFeedbacks: FeedbackId[] = []
	// 		const variableUpdates: { [variableId: string]: string | number | boolean | undefined } = {} // TODO - type of this

	// 		if (forceUpdate || oldState?.isPlaying !== newState?.isPlaying) {
	// 			variableUpdates['isPlaying'] = !!newState?.isPlaying
	// 			variableUpdates['isPlayingIcon'] = newState?.isPlaying ? '\u23F5' : '\u23F9'

	// 			invalidatedFeedbacks.push(FeedbackId.IsPlaying)
	// 		}
	// 		if (forceUpdate || oldState?.isShuffle !== newState?.isShuffle) {
	// 			invalidatedFeedbacks.push(FeedbackId.IsShuffle)
	// 			variableUpdates['isShuffle'] = !!newState?.isShuffle
	// 		}
	// 		if (forceUpdate || oldState?.repeatState !== newState?.repeatState) {
	// 			invalidatedFeedbacks.push(FeedbackId.IsRepeat)
	// 			variableUpdates['repeat'] = newState?.repeatState ?? 'off'
	// 		}
	// 		if (forceUpdate || oldState?.currentContext !== newState?.currentContext) {
	// 			this.checkFeedbacks('current-context')
	// 			variableUpdates['currentContext'] = newState?.currentContext ?? ''
	// 		}

	// 		// Track info
	// 		if (forceUpdate || oldState?.trackInfo?.artistName !== newState?.trackInfo?.artistName) {
	// 			variableUpdates['artistName'] = newState?.trackInfo?.artistName ?? ''
	// 		}
	// 		if (forceUpdate || oldState?.trackInfo?.name !== newState?.trackInfo?.name) {
	// 			variableUpdates['songName'] = newState?.trackInfo?.name ?? ''
	// 		}
	// 		if (forceUpdate || oldState?.trackInfo?.albumName !== newState?.trackInfo?.albumName) {
	// 			variableUpdates['albumName'] = newState?.trackInfo?.albumName ?? ''
	// 		}
	// 		if (forceUpdate || oldState?.trackInfo?.albumImageUrl !== newState?.trackInfo?.albumImageUrl) {
	// 			variableUpdates['currentAlbumArt'] = newState?.trackInfo?.albumImageUrl ?? ''
	// 		}

	// 		// Look for track progress/duration changes
	// 		let progressChanged = false
	// 		if (forceUpdate || oldState?.trackProgressMs !== newState?.trackProgressMs) {
	// 			progressChanged = true
	// 			variableUpdates['songProgressSeconds'] = ((newState?.trackProgressMs ?? 0) / 1000).toFixed(0)
	// 		}
	// 		if (forceUpdate || oldState?.trackInfo?.durationMs !== newState?.trackInfo?.durationMs) {
	// 			progressChanged = true
	// 			variableUpdates['songDurationSeconds'] = ((newState?.trackInfo?.durationMs ?? 0) / 1000).toFixed(0)
	// 		}
	// 		if (forceUpdate || progressChanged) {
	// 			const progressMs = newState?.trackProgressMs ?? 0
	// 			const durationMs = newState?.trackInfo?.durationMs ?? 0

	// 			variableUpdates['songPercentage'] = durationMs > 0 ? ((progressMs / durationMs) * 100).toFixed(0) : '-'

	// 			const remainingTotalMs = Math.max(durationMs - progressMs, 0) // remaining clamped to >=0
	// 			const remainingSeconds = Math.floor((remainingTotalMs / 1000) % 60)
	// 			const remainingMins = Math.floor((remainingTotalMs / (1000 * 60)) % 60)
	// 			const remainingHours = Math.floor(remainingTotalMs / (1000 * 60 * 60))
	// 			const remainingStr = `${remainingHours.toString().padStart(2, '0')}:${remainingMins
	// 				.toString()
	// 				.padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`

	// 			variableUpdates['songTimeRemaining'] = remainingStr
	// 			variableUpdates['songTimeRemainingHours'] = remainingHours
	// 			variableUpdates['songTimeRemainingMinutes'] = remainingMins
	// 			variableUpdates['songTimeRemainingSeconds'] = remainingSeconds
	// 		}

	// 		// Device info
	// 		if (forceUpdate || oldState?.deviceInfo?.volumePercent !== newState?.deviceInfo?.volumePercent) {
	// 			variableUpdates['volume'] = newState?.deviceInfo?.volumePercent ?? '-'
	// 		}
	// 		if (forceUpdate || oldState?.deviceInfo?.name !== newState?.deviceInfo?.name) {
	// 			invalidatedFeedbacks.push(FeedbackId.ActiveDevice)
	// 			variableUpdates['deviceName'] = newState?.deviceInfo?.name ?? '-'
	// 		}

	// 		// Inform companion of the state changes
	// 		if (invalidatedFeedbacks.length > 0) this.checkFeedbacks(...invalidatedFeedbacks)
	// 		if (Object.keys(variableUpdates).length > 0) this.setVariableValues(variableUpdates)
	// 	}
}

runEntrypoint(MyInstance, UpgradeScripts)
