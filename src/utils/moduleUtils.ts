/**
 * Helpers for the cascading Module -> Submodule filter used on the Defects and
 * Test Cases screens.
 *
 * Submodules are loaded from a dedicated API keyed by the selected module id
 * (see `getSubModules` in defectService). These helpers unwrap the API response
 * into a plain array and normalise each item to a consistent `{ id, name }`
 * shape, tolerating the various field names the backend might use. All id
 * comparisons are done as strings because dropdown values can arrive as either
 * numbers or strings.
 */

export interface SubModuleOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

// Possible field names for a submodule's id / display name across API variants.
const ID_KEYS = ['id', 'subModuleId', 'submoduleId', 'value'];
const NAME_KEYS = ['name', 'subModuleName', 'submoduleName', 'title', 'label'];

const firstDefined = (obj: any, keys: string[]) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
};

/**
 * Unwraps a list from a typical API response. Handles axios responses shaped as
 * `{ data: { data: [...] } }`, `{ data: [...] }`, `{ data: { content: [...] } }`
 * and a bare array. Always returns an array.
 */
export const unwrapApiList = (res: any): any[] => {
  let result = res?.data?.data ?? res?.data ?? [];
  if (result && !Array.isArray(result) && Array.isArray(result.content)) {
    result = result.content;
  }
  return Array.isArray(result) ? result : [];
};

/**
 * Normalises raw submodule records into `{ id, name, ...raw }` so the dropdown
 * always has a value and a label regardless of the backend field names.
 */
export const normalizeSubModules = (list: any[]): SubModuleOption[] => {
  if (!Array.isArray(list)) return [];
  return list
    .map((sm: any) => {
      const id = firstDefined(sm, ID_KEYS);
      const name = firstDefined(sm, NAME_KEYS) ?? (id != null ? `Submodule ${id}` : '');
      return { ...sm, id, name };
    })
    .filter((sm: SubModuleOption) => sm.id !== undefined && sm.id !== null);
};

/**
 * True when the currently selected submodule is still a valid choice for the
 * loaded submodule list. An empty selection ('') is always considered valid,
 * so callers only clear a *stale* selection.
 */
export const isSubModuleValid = (
  subModules: any[],
  subModuleId: number | string | undefined | null,
): boolean => {
  if (subModuleId === undefined || subModuleId === null || subModuleId === '') return true;
  if (!Array.isArray(subModules)) return false;
  return subModules.some((s: any) => s && String(s.id) === String(subModuleId));
};
