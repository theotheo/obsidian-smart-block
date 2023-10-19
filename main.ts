import { App, Editor, HeadingCache, ListItemCache, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, SectionCache, Setting } from 'obsidian';
import moment from "moment";

interface SmartBlockSettings {
	format: string;
}

const DEFAULT_SETTINGS: SmartBlockSettings = {
	format: 'YYYYMMDDHHmmss'
}

export default class SmartBlock extends Plugin {
	settings: SmartBlockSettings;

	generateId() {
		return moment().format(this.settings.format);
	}

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Set block id',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const fileCache = this.app.metadataCache.getFileCache(view.file);
				const cursor = editor.getCursor("to");
				let block: ListItemCache | HeadingCache | SectionCache = (
					fileCache?.sections || []
				  ).find((section) => {
					return (
					  section.position.start.line <= cursor.line &&
					  section.position.end.line >= cursor.line
					);
				  });
				new Notice(JSON.stringify(block))
				const headings: HeadingCache[] = (fileCache?.headings || [])
				let headingIndex = headings.findLastIndex((heading) => {
					return (heading.position.start.line <= cursor.line);
				  });
				new Notice(JSON.stringify(headings[headingIndex]))
				// console.log(editor.getSelection());
				let blockId: string = block.id;
				if (!blockId) {
					blockId = this.generateId()
					editor.replaceRange(` ^${blockId}`, block.position.end)

				}
				navigator.clipboard.writeText(blockId)
				// editor.replaceSelection('Sample Editor Command');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SmartBlockSettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
class SmartBlockSettingTab extends PluginSettingTab {
	plugin: SmartBlock;

	constructor(app: App, plugin: SmartBlock) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Block Id Format')
			.setDesc('Moment.js-dateformat string')
			.addText(text => text
				.setPlaceholder('YYYYMMDDHHmmss')
				.setValue(this.plugin.settings.format)
				.onChange(async (value) => {
					this.plugin.settings.format = value;
					await this.plugin.saveSettings();
				}));
	}
}
