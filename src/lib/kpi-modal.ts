export function modalHint(isReadOnly: boolean, hint: string): string | undefined {
  return isReadOnly ? undefined : hint;
}
