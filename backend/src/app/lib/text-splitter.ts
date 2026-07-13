import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";

const CJK_REGEX = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

const CHINESE_SEPARATORS: string[] = [
  "\n\n",
  "\n",
  "。",
  "！",
  "？",
  "；",
  "，",
  "",
];

const ENGLISH_SEPARATORS: string[] = [
  "\n\n",
  "\n",
  ". ",
  "! ",
  "? ",
  "; ",
  ", ",
  " ",
  "",
];

function containsCjk(text: string): boolean {
  return CJK_REGEX.test(text);
}

function buildSeparators(
  languageHint: string | null | undefined,
  text: string,
  custom?: readonly string[] | null
): string[] {
  if (custom && custom.length > 0) {
    const separators = [...custom];

    if (separators[separators.length - 1] !== "") {
      separators.push("");
    }

    return separators;
  }

  const hint = (languageHint ?? "").toLowerCase();

  if (["zh", "zh-cn", "chinese", "cn"].includes(hint) || containsCjk(text)) {
    return CHINESE_SEPARATORS;
  }

  return ENGLISH_SEPARATORS;
}
export function createTextSplitter(text: string, chunkSize: number, chunkOverlap: number, languageHint: string, separators: string[], keepSeparator: boolean){
  separators = buildSeparators(languageHint, text, separators)
  return new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize,
    chunkOverlap: chunkOverlap,
    separators: separators,
    lengthFunction: (text: string) => text.length,
    keepSeparator: keepSeparator,
  });
}


