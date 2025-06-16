export function html(raw: TemplateStringsArray, ...values: any[]) {
  return String.raw({ raw }, ...values);
}
