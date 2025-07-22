
export function getDictionaryIndexPath() {
  return `${import.meta.env.BASE_URL}data/internal/v1/dictionary/index.json`;
}

export function getChunkPath(chunkFileName) {
  return `${import.meta.env.BASE_URL}data/internal/v1/dictionary/chunks/${chunkFileName}`;
}
