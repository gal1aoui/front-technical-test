export interface FileItem {
	id: string;
	parentId: string | null;
	name: string;
	folder: boolean;
	creation: string;
	modification: string;
	filePath?: string;
	mimeType?: string;
	size?: number;
}

export interface FileItemDetails {
	fileName: string;
	fileExtension: string;
	creationDate: string;
	path: string;
	size: string;
}

export function getFileExtension(fileName: string): string {
	const trimmed = fileName.trim();
	const lastDot = trimmed.lastIndexOf('.');
	if (lastDot <= 0 || lastDot === trimmed.length - 1) return '-';
	return trimmed.slice(lastDot + 1).toLowerCase();
}

export function buildItemPath(item: FileItem, items: FileItem[]): string {
	const byId = new Map(items.map(current => [current.id, current]));
	const names: string[] = [item.name];
	let parentId = item.parentId;
	const seen = new Set<string>();

	while (parentId && !seen.has(parentId)) {
		seen.add(parentId);
		const parent = byId.get(parentId);
		if (!parent) break;
		names.unshift(parent.name);
		parentId = parent.parentId;
	}

	return `/${names.join('/')}`;
}
