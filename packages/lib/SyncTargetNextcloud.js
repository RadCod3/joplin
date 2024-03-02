// The Nextcloud sync target is essentially a wrapper over the WebDAV sync target,
// thus all the calls to SyncTargetWebDAV to avoid duplicate code.

const BaseSyncTarget = require('./BaseSyncTarget').default;
const { _ } = require('./locale');
const Setting = require('./models/Setting').default;
const Synchronizer = require('./Synchronizer').default;
const SyncTargetWebDAV = require('./SyncTargetWebDAV');

class SyncTargetNextcloud extends BaseSyncTarget {

	static id() {
		return 5;
	}

	static supportsConfigCheck() {
		return true;
	}

	static targetName() {
		return 'nextcloud';
	}

	static label() {
		return _('Nextcloud');
	}

	static description() {
		return 'A suite of client-server software for creating and using file hosting services.';
	}

	async isAuthenticated() {
		return true;
	}

	static requiresPassword() {
		return true;
	}

	static async checkConfig(options) {
		return SyncTargetWebDAV.checkConfig(options);
	}

	async initFileApi() {
		const fileApi = await SyncTargetWebDAV.newFileApi_(SyncTargetNextcloud.id(), {
			path: () => Setting.value('sync.5.path'),
			username: () => Setting.value('sync.5.username'),
			password: () => Setting.value('sync.5.password'),
			ignoreTlsErrors: () => Setting.value('net.ignoreTlsErrors'),
		});

		fileApi.setLogger(this.logger());

		// Check if server has editWarningFile
		const editWarningFile = { 'name': '_⚠️_IMPORTANT_READ_FIRST_⚠️_.md', 'content': 'WARNING DO NOT EDIT ANY MARKDOWN FILE' };
		const response = await fileApi.get(editWarningFile.name);
		if (!response) {
			this.logger().info('Nextcloud: Missing edit warning file... adding it');
			await fileApi.put(editWarningFile.name, editWarningFile.content);
		} else if (response !== editWarningFile.content) {
			this.logger().info('Nextcloud: Edit warning file has wrong content... updating it');
			await fileApi.put(editWarningFile.name, editWarningFile.content);
		} else {
			this.logger().info('Nextcloud: Edit warning file is present and has the correct content');
		}
		return fileApi;
	}

	async initSynchronizer() {
		return new Synchronizer(this.db(), await this.fileApi(), Setting.value('appType'));
	}

}

module.exports = SyncTargetNextcloud;
