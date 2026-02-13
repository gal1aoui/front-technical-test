export type UploadCandidate = {
	id: string;
	file: File;
	relativePath?: string;
};

type DropDirectoryReader = {
	readEntries: (callback: (entries: FileSystemEntry[]) => void) => void;
};

type DropFileEntry = FileSystemEntry & {
	file: (success: (file: File) => void, error?: () => void) => void;
};

type DropDirectoryEntry = FileSystemEntry & {
	createReader: () => DropDirectoryReader;
};

export function getFileRelativePath(file: File): string {
	const extendedFile = file as File & { webkitRelativePath?: string };
	const relativePath = extendedFile.webkitRelativePath?.trim();
	return relativePath || file.name;
}

export function toUploadCandidate(
	file: File,
	relativePath?: string
): UploadCandidate {
	const keyPath = relativePath || file.name;
	return {
		id: `${keyPath}:${file.size}:${file.lastModified}`,
		file,
		relativePath,
	};
}

export function filesToUploadCandidates(
	files: File[],
	withRelativePath = false
): UploadCandidate[] {
	return files.map(file =>
		toUploadCandidate(
			file,
			withRelativePath ? getFileRelativePath(file) : undefined
		)
	);
}

export async function dataTransferToUploadCandidates(
	transfer: DataTransfer
): Promise<UploadCandidate[]> {
	const items = transfer.items ? Array.from(transfer.items) : [];
	if (items.length === 0) {
		const files = transfer.files ? Array.from(transfer.files) : [];
		return filesToUploadCandidates(files);
	}

	const collected: UploadCandidate[] = [];
	for (const item of items) {
		const maybeEntry = item.webkitGetAsEntry?.();
		if (!maybeEntry) {
			const file = item.getAsFile();
			if (file) collected.push(toUploadCandidate(file));
			continue;
		}

		await collectEntryFiles(maybeEntry, '', collected);
	}

	return collected;
}

async function collectEntryFiles(
	entry: FileSystemEntry,
	parentPath: string,
	target: UploadCandidate[]
): Promise<void> {
	if (entry.isFile) {
		const fileEntry = entry as DropFileEntry;
		const file = await new Promise<File | null>(resolve => {
			fileEntry.file(
				(resolved: File) => resolve(resolved),
				() => resolve(null)
			);
		});
		if (!file) return;
		const path = parentPath ? `${parentPath}/${file.name}` : file.name;
		target.push(toUploadCandidate(file, path));
		return;
	}

	if (!entry.isDirectory) return;
	const directoryEntry = entry as DropDirectoryEntry;
	const reader = directoryEntry.createReader();
	const children = await readAllDirectoryEntries(reader);
	const nextParent = parentPath ? `${parentPath}/${entry.name}` : entry.name;
	for (const child of children) {
		await collectEntryFiles(child, nextParent, target);
	}
}

async function readAllDirectoryEntries(
	reader: DropDirectoryReader
): Promise<FileSystemEntry[]> {
	const results: FileSystemEntry[] = [];
	let done = false;

	while (!done) {
		const chunk = await new Promise<FileSystemEntry[]>(resolve =>
			reader.readEntries((entries: FileSystemEntry[]) => resolve(entries))
		);
		if (chunk.length === 0) {
			done = true;
			continue;
		}
		results.push(...chunk);
	}

	return results;
}
