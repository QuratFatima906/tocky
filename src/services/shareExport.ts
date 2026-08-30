import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';

import { exportContents, exportFileName, type ExportContents, type ExportFormat } from '@/domain';

/**
 * The share sheet takes a file rather than a wall of text, because a CSV is
 * only useful if it arrives as something a spreadsheet will open.
 *
 * It goes to the cache directory: the copy that matters is whatever the user
 * sends it to, and iOS is free to reclaim ours afterwards.
 */
export type ExportOutcome = 'shared' | 'dismissed' | 'failed';

export async function shareExport(
  contents: ExportContents,
  format: ExportFormat,
  now: number,
): Promise<ExportOutcome> {
  try {
    const file = new File(Paths.cache, exportFileName(format, now));
    if (file.exists) file.delete();
    file.create();
    file.write(exportContents(contents, format, now));

    const result = await Share.share({ url: file.uri, title: file.name });

    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    // A disk that cannot take the file, or a share sheet that will not open,
    // is reported rather than left looking like the export went out.
    return 'failed';
  }
}
